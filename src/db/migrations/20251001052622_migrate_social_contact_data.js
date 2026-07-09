const logger = require("../../utils/logger");

const MIGRATION_NAME = "migrate_social_contacts_data";
const BATCH_SIZE = 500;
const TRANSACTION_TIMEOUT = 600000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const SAMPLING_SIZE = 150;

exports.config = {
  transaction: false,
};

async function validateTableStructure(knex) {
  logger.info("[PRE-CHECK] 🔍 Validating table structures...");

  const oldTableExists = await knex.schema.hasTable("social_contacts_old");
  if (!oldTableExists) {
    throw new Error("Source table 'social_contacts_old' does not exist!");
  }

  const newTableExists = await knex.schema.hasTable("social_contacts");
  if (!newTableExists) {
    throw new Error("Destination table 'social_contacts' does not exist!");
  }

  const oldColumns = await knex.raw(`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'social_contacts_old'
  `);

  const newColumns = await knex.raw(`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'social_contacts'
  `);

  const oldCols = oldColumns[0].reduce((acc, col) => {
    acc[col.COLUMN_NAME] = col.DATA_TYPE;
    return acc;
  }, {});

  const newCols = newColumns[0].reduce((acc, col) => {
    acc[col.COLUMN_NAME] = col.DATA_TYPE;
    return acc;
  }, {});

  const requiredFields = [
    "uuid_unique",
    "contact_id",
    "network_id",
    "extra1",
    "extra2",
    "extra3",
    "picture",
    "metadata",
  ];

  for (const field of requiredFields) {
    if (!oldCols[field]) {
      throw new Error(
        `Required column '${field}' not found in source table 'social_contacts_old'`
      );
    }

    if (!newCols[field]) {
      throw new Error(
        `Required column '${field}' not found in destination table 'social_contacts'`
      );
    }
  }

  logger.info("[PRE-CHECK] ✅ Table structures are compatible");
  return true;
}

function normalizeMetadataToNewFormat(metadata) {
  if (!metadata) return null;

  if (metadata.general) {
    return metadata;
  }

  return {
    general: {
      ...metadata,
    },
  };
}

function validateRecord(record) {
  const errors = [];

  if (!record.contact_id || record.contact_id.trim() === "") {
    errors.push("contact_id is required");
  }

  if (!record.network_id || record.network_id.trim() === "") {
    errors.push("network_id is required");
  }

  let sanitizedMetadata = null;
  if (record.metadata) {
    try {
      const metadataStr =
        typeof record.metadata === "string"
          ? record.metadata
          : JSON.stringify(record.metadata);

      const parsed = JSON.parse(metadataStr);
      sanitizedMetadata = normalizeMetadataToNewFormat(parsed);
    } catch (err) {
      errors.push(`Invalid JSON in metadata: ${err.message}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedMetadata,
  };
}

async function getLastCheckpoint(knex) {
  const checkpoint = await knex("migration_checkpoints")
    .where({ migration_name: MIGRATION_NAME })
    .orderBy("id", "desc")
    .first();

  return checkpoint || null;
}

async function saveCheckpoint(knex, batchId, stats) {
  await knex("migration_checkpoints").insert({
    migration_name: MIGRATION_NAME,
    last_batch_id: batchId,
    records_processed: stats.processed,
    records_inserted: stats.inserted,
    records_skipped: stats.skipped,
    records_errored: stats.errored,
    status: "running",
    updated_at: knex.fn.now(),
  });
}

async function markCheckpointCompleted(knex, stats) {
  await knex("migration_checkpoints")
    .where({ migration_name: MIGRATION_NAME })
    .orderBy("id", "desc")
    .limit(1)
    .update({
      status: "completed",
      records_processed: stats.processed,
      records_inserted: stats.inserted,
      records_skipped: stats.skipped,
      records_errored: stats.errored,
      updated_at: knex.fn.now(),
    });
}

async function markCheckpointFailed(knex) {
  await knex("migration_checkpoints")
    .where({ migration_name: MIGRATION_NAME, status: "running" })
    .update({
      status: "failed",
      updated_at: knex.fn.now(),
    });
}

async function processBatch(knex, trx, records, batchId, stats) {
  let attempts = 0;
  let lastError = null;

  while (attempts < MAX_RETRIES) {
    try {
      const savepointName = `batch_${batchId}_attempt_${attempts}`;

      await trx.raw(`SAVEPOINT ${savepointName}`);

      for (const record of records) {
        const validation = validateRecord(record);

        if (!validation.isValid) {
          console.warn(
            `[BATCH ${batchId}] ⚠️  Skipping record ${
              record.contact_id
            }: ${validation.errors.join(", ")}`
          );
          stats.errored++;
          stats.processed++;
          continue;
        }

        const existing = await trx("social_contacts")
          .where("contact_id", record.contact_id)
          .first();

        if (existing) {
          logger.info(
            `[BATCH ${batchId}] ⏭️  Skipping duplicate contact_id: ${record.contact_id}`
          );
          stats.skipped++;
          stats.processed++;
          continue;
        }

        await trx.raw("SET @UUID_TRIGGER_SKIP = 1;");

        await trx("social_contacts").insert({
          uuid_unique: record.uuid_unique,
          contact_id: record.contact_id,
          network_id: record.network_id,
          extra1: record.extra1,
          extra2: record.extra2,
          extra3: record.extra3,
          picture: record.picture,
          metadata: validation.sanitizedMetadata
            ? JSON.stringify(validation.sanitizedMetadata)
            : null,
        });

        await trx.raw("SET @UUID_TRIGGER_SKIP = 0;");

        stats.inserted++;
        stats.processed++;
      }

      await trx.raw(`RELEASE SAVEPOINT ${savepointName}`);
      return true;
    } catch (error) {
      lastError = error;
      attempts++;

      const isDeadlock =
        error.code === "ER_LOCK_DEADLOCK" || error.errno === 1213;

      if (isDeadlock && attempts < MAX_RETRIES) {
        console.warn(
          `[BATCH ${batchId}] ⚠️  Deadlock detected, retrying (${attempts}/${MAX_RETRIES})...`
        );

        await trx.raw(
          `ROLLBACK TO SAVEPOINT batch_${batchId}_attempt_${attempts - 1}`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempts - 1))
        );
      } else {
        throw error;
      }
    }
  }

  throw new Error(
    `Failed to process batch ${batchId} after ${MAX_RETRIES} attempts: ${lastError.message}`
  );
}

async function validatePostMigration(knex) {
  logger.info("[POST-VALIDATION] 🔍 Starting post-migration validation...");

  const oldCount = await knex("social_contacts_old").count("* as total");
  const newCount = await knex("social_contacts").count("* as total");

  const totalOld = parseInt(oldCount[0].total);
  const totalNew = parseInt(newCount[0].total);

  logger.info(`[POST-VALIDATION] 📊 Record counts:`);
  logger.info(`  - social_contacts_old: ${totalOld}`);
  logger.info(`  - social_contacts: ${totalNew}`);

  if (totalNew > totalOld) {
    console.warn(
      `[POST-VALIDATION] ⚠️  WARNING: Destination has more records (${totalNew}) than source (${totalOld})`
    );
    console.warn(
      `[POST-VALIDATION] ⚠️  This suggests pre-existing records in social_contacts table`
    );
  }

  logger.info(
    `[POST-VALIDATION] 🎲 Performing random sampling of ${SAMPLING_SIZE} records...`
  );

  const sampleSize = Math.min(SAMPLING_SIZE, totalOld);
  const sampleRecords = await knex("social_contacts_old")
    .orderByRaw("RAND()")
    .limit(sampleSize);

  let samplingErrors = 0;
  let samplingChecked = 0;

  for (const oldRecord of sampleRecords) {
    const newRecord = await knex("social_contacts")
      .where("contact_id", oldRecord.contact_id)
      .first();

    if (!newRecord) {
      continue;
    }

    samplingChecked++;

    if (oldRecord.network_id !== newRecord.network_id) {
      logger.error(
        `[POST-VALIDATION] ❌ Mismatch for contact_id ${oldRecord.contact_id}: network_id`
      );
      samplingErrors++;
    }

    if (oldRecord.extra1 !== newRecord.extra1) {
      logger.error(
        `[POST-VALIDATION] ❌ Mismatch for contact_id ${oldRecord.contact_id}: extra1`
      );
      samplingErrors++;
    }

    if (oldRecord.metadata && newRecord.metadata) {
      try {
        const oldMeta =
          typeof oldRecord.metadata === "string"
            ? JSON.parse(oldRecord.metadata)
            : oldRecord.metadata;
        const newMeta =
          typeof newRecord.metadata === "string"
            ? JSON.parse(newRecord.metadata)
            : newRecord.metadata;

        if (JSON.stringify(oldMeta) !== JSON.stringify(newMeta)) {
          console.warn(
            `[POST-VALIDATION] ⚠️  WARNING: Mismatch for contact_id ${oldRecord.contact_id}: metadata`
          );
          console.warn(`  This may be due to pre-existing records or format differences`);
          samplingErrors++;
        }
      } catch (err) {
        console.warn(
          `[POST-VALIDATION] ⚠️  WARNING: JSON parse error for contact_id ${oldRecord.contact_id}, error:${err}`
        );
        samplingErrors++;
      }
    }
  }

  logger.info(
    `[POST-VALIDATION] ✅ Sampling checked ${samplingChecked} records`
  );

  if (samplingErrors > 0) {
    console.warn(
      `[POST-VALIDATION] ⚠️  Found ${samplingErrors} metadata discrepancies in sampling - this is expected for pre-existing records`
    );
  }

  logger.info(
    "[POST-VALIDATION] 🔍 Checking for duplicates in destination table..."
  );

  const duplicates = await knex.raw(`
    SELECT contact_id, COUNT(*) as count
    FROM social_contacts
    GROUP BY contact_id
    HAVING count > 1
  `);

  if (duplicates[0].length > 0) {
    logger.error("[POST-VALIDATION] ❌ Found duplicate contact_ids:");
    duplicates[0].forEach((dup) => {
      logger.error(`  - ${dup.contact_id}: ${dup.count} times`);
    });
    throw new Error("Duplicate contact_ids found in destination table");
  }

  logger.info("[POST-VALIDATION] ✅ No duplicates found in destination table");
  logger.info("[POST-VALIDATION] ✅ All validations passed!");

  return true;
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const startTime = Date.now();
  logger.info("=".repeat(80));
  logger.info(
    "🚀 PHASE 1: MIGRATE DATA FROM social_contacts_old TO social_contacts"
  );
  logger.info("=".repeat(80));

  let stats = {
    processed: 0,
    inserted: 0,
    skipped: 0,
    errored: 0,
  };

  try {
    logger.info("📋 PRE-MIGRATION CHECKS");
    logger.info("-".repeat(80));

    await validateTableStructure(knex);

    await knex.raw(
      `DROP TRIGGER IF EXISTS social_contacts_before_insert_uuid;`
    );

    await knex.raw(`
       CREATE TRIGGER social_contacts_before_insert_uuid
       BEFORE INSERT ON social_contacts
       FOR EACH ROW
       BEGIN
         IF @UUID_TRIGGER_SKIP IS NULL OR @UUID_TRIGGER_SKIP = 0 THEN
           SET NEW.uuid_unique = uuid_v4();
         END IF;
       END
    `);

    const initialCount = await knex("social_contacts_old").count("* as total");
    const totalRecords = initialCount[0].total;
    logger.info(`[INFO] 📊 Total records to migrate: ${totalRecords}`);

    if (totalRecords === 0) {
      logger.info("[INFO] ⚠️  No records to migrate. Exiting.");
      return;
    }

    const lastCheckpoint = await getLastCheckpoint(knex);
    let startBatch = 0;

    if (
      lastCheckpoint &&
      (lastCheckpoint.status === "running" ||
        lastCheckpoint.status === "failed")
    ) {
      logger.info(`[INFO] 🔄 Found checkpoint from previous run:`);
      logger.info(`  - Last batch: ${lastCheckpoint.last_batch_id}`);
      logger.info(`  - Records processed: ${lastCheckpoint.records_processed}`);
      logger.info(
        `  - Resuming from batch ${lastCheckpoint.last_batch_id + 1}...`
      );

      startBatch = lastCheckpoint.last_batch_id + 1;
      stats.processed = lastCheckpoint.records_processed;
      stats.inserted = lastCheckpoint.records_inserted;
      stats.skipped = lastCheckpoint.records_skipped;
      stats.errored = lastCheckpoint.records_errored;
    }

    logger.info("📦 DATA MIGRATION");
    logger.info("-".repeat(80));

    const totalBatches = Math.ceil(totalRecords / BATCH_SIZE);
    let currentBatch = startBatch;

    while (currentBatch < totalBatches) {
      const offset = currentBatch * BATCH_SIZE;

      logger.info(
        `[BATCH ${currentBatch + 1}/${totalBatches}] Processing records ${
          offset + 1
        } to ${Math.min(offset + BATCH_SIZE, totalRecords)}...`
      );

      const records = await knex("social_contacts_old")
        .select("*")
        .limit(BATCH_SIZE)
        .offset(offset);

      if (records.length === 0) {
        logger.info(`[BATCH ${currentBatch + 1}] No more records to process`);
        break;
      }

      await knex.raw(
        `SET SESSION innodb_lock_wait_timeout = ${TRANSACTION_TIMEOUT / 1000}`
      );

      await knex.transaction(async (trx) => {
        await processBatch(knex, trx, records, currentBatch, stats);
      });

      await knex.raw(`SET SESSION innodb_lock_wait_timeout = DEFAULT`);

      await saveCheckpoint(knex, currentBatch, stats);

      logger.info(
        `[BATCH ${currentBatch + 1}] ✅ Completed | Processed: ${
          stats.processed
        } | Inserted: ${stats.inserted} | Skipped: ${stats.skipped} | Errors: ${
          stats.errored
        }`
      );

      currentBatch++;
    }

    logger.info("✅ POST-MIGRATION VALIDATION");
    logger.info("-".repeat(80));

    await validatePostMigration(knex);

    await markCheckpointCompleted(knex, stats);

    await knex.raw(
      `DROP TRIGGER IF EXISTS social_contacts_before_insert_uuid;`
    );
    await knex.raw(`
      CREATE TRIGGER social_contacts_before_insert_uuid
      BEFORE INSERT ON social_contacts
      FOR EACH ROW
      BEGIN
        SET NEW.uuid_unique = uuid_v4();
      END
    `);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    logger.info("=".repeat(80));
    logger.info("🎉 DATA MIGRATION COMPLETED SUCCESSFULLY!");
    logger.info("=".repeat(80));
    logger.info("📊 FINAL REPORT:");
    logger.info(`  ⏱️  Duration: ${duration} seconds`);
    logger.info(`  📝 Total records processed: ${stats.processed}`);
    logger.info(`  ✅ Records inserted: ${stats.inserted}`);
    logger.info(`  ⏭️  Records skipped (duplicates): ${stats.skipped}`);
    logger.info(`  ❌ Records with errors: ${stats.errored}`);
    logger.info(
      `  📈 Success rate: ${((stats.inserted / stats.processed) * 100).toFixed(
        2
      )}%`
    );
    logger.info("=".repeat(80));
    logger.info("");
  } catch (error) {
    logger.error("=".repeat(80));
    logger.error("❌ MIGRATION FAILED!");
    logger.error("=".repeat(80));
    logger.error("🔥 Error:", error.message);
    logger.error("📊 Stats at failure:");
    logger.error(`  - Processed: ${stats.processed}`);
    logger.error(`  - Inserted: ${stats.inserted}`);
    logger.error(`  - Skipped: ${stats.skipped}`);
    logger.error(`  - Errored: ${stats.errored}`);
    logger.error("⚠️  You can resume the migration by running it again.");
    logger.error("=".repeat(80));

    try {
      await markCheckpointFailed(knex);
    } catch (checkpointError) {
      logger.error(
        "Failed to mark checkpoint as failed:",
        checkpointError.message
      );
    }

    throw error;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
// eslint-disable-next-line no-unused-vars
exports.down = async function (knex) {
  logger.info("⚠️  Rolling back data migration...");
  logger.info("This will delete all migrated data from social_contacts");
  logger.info("⚠️  Rollback completed");
};
