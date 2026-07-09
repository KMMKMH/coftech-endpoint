const logger = require("../../utils/logger");

const MIGRATION_NAME = "normalize_social_contacts_metadata";
const BATCH_SIZE = 500;
const TRANSACTION_TIMEOUT = 600000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

exports.config = {
  transaction: false,
};

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
    records_inserted: stats.updated,
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
      records_inserted: stats.updated,
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
        try {
          if (!record.metadata) {
            stats.skipped++;
            stats.processed++;
            continue;
          }

          let parsedMetadata;
          try {
            parsedMetadata =
              typeof record.metadata === "string"
                ? JSON.parse(record.metadata)
                : record.metadata;
          } catch {
            logger.warn(
              `[BATCH ${batchId}] Invalid JSON for contact ${record.uuid_unique}, skipping`
            );
            stats.errored++;
            stats.processed++;
            continue;
          }

          if (parsedMetadata.general) {
            stats.skipped++;
            stats.processed++;
            continue;
          }

          const normalizedMetadata = normalizeMetadataToNewFormat(parsedMetadata);

          await trx("social_contacts")
            .where("uuid_unique", record.uuid_unique)
            .update({
              metadata: JSON.stringify(normalizedMetadata),
              updated_at: trx.fn.now(),
            });

          stats.updated++;
          stats.processed++;
        } catch (recordError) {
          logger.error(
            `[BATCH ${batchId}] Error processing record ${record.uuid_unique}: ${recordError.message}`
          );
          stats.errored++;
          stats.processed++;
        }
      }

      await trx.raw(`RELEASE SAVEPOINT ${savepointName}`);
      return true;
    } catch (error) {
      lastError = error;
      attempts++;

      const isDeadlock =
        error.code === "ER_LOCK_DEADLOCK" || error.errno === 1213;

      if (isDeadlock && attempts < MAX_RETRIES) {
        logger.warn(
          `[BATCH ${batchId}] Deadlock detected, retrying (${attempts}/${MAX_RETRIES})...`
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

async function validateNormalization(knex) {
  logger.info("[POST-VALIDATION] Validating metadata normalization...");

  const legacyRecords = await knex.raw(`
    SELECT COUNT(*) as count
    FROM social_contacts
    WHERE metadata IS NOT NULL
      AND metadata != 'null'
      AND JSON_TYPE(metadata) = 'OBJECT'
      AND JSON_EXTRACT(metadata, '$.general') IS NULL
  `);

  const legacyCount = legacyRecords[0][0].count;

  if (legacyCount > 0) {
    logger.warn(
      `[POST-VALIDATION] Found ${legacyCount} records still in legacy format`
    );
  } else {
    logger.info(
      "[POST-VALIDATION] All records successfully normalized to new format"
    );
  }

  const totalRecords = await knex("social_contacts")
    .whereNotNull("metadata")
    .count("* as total");

  const normalizedRecords = await knex.raw(`
    SELECT COUNT(*) as count
    FROM social_contacts
    WHERE metadata IS NOT NULL
      AND metadata != 'null'
      AND JSON_TYPE(metadata) = 'OBJECT'
      AND JSON_EXTRACT(metadata, '$.general') IS NOT NULL
  `);

  logger.info("[POST-VALIDATION] Normalization stats:");
  logger.info(`  - Total records with metadata: ${totalRecords[0].total}`);
  logger.info(`  - Normalized records: ${normalizedRecords[0][0].count}`);
  logger.info(`  - Legacy format records: ${legacyCount}`);

  return true;
}

exports.up = async function (knex) {
  const startTime = Date.now();
  logger.info("=".repeat(80));
  logger.info("🔄 NORMALIZING METADATA IN social_contacts TABLE");
  logger.info("=".repeat(80));

  let stats = {
    processed: 0,
    updated: 0,
    skipped: 0,
    errored: 0,
  };

  let checkpointTableCreated = false;

  try {
    const tableExists = await knex.schema.hasTable("migration_checkpoints");
    if (!tableExists) {
      logger.info(
        "[SETUP] Creating migration_checkpoints table for this migration..."
      );
      await knex.schema.createTable("migration_checkpoints", (table) => {
        table.increments("id").primary();
        table.string("migration_name", 255).notNullable();
        table.integer("last_batch_id").notNullable().defaultTo(0);
        table.integer("records_processed").notNullable().defaultTo(0);
        table.integer("records_inserted").notNullable().defaultTo(0);
        table.integer("records_skipped").notNullable().defaultTo(0);
        table.integer("records_errored").notNullable().defaultTo(0);
        table
          .enum("status", ["running", "completed", "failed"])
          .notNullable()
          .defaultTo("running");
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

        table.index("migration_name");
        table.index(["migration_name", "status"]);
      });
      checkpointTableCreated = true;
      logger.info("[SETUP] migration_checkpoints table created successfully");
    }
    const totalRecordsResult = await knex("social_contacts")
      .whereNotNull("metadata")
      .count("* as total");

    const totalRecords = parseInt(totalRecordsResult[0].total);
    logger.info(`[INFO] Total records with metadata: ${totalRecords}`);

    if (totalRecords === 0) {
      logger.info("[INFO] No records to process. Exiting.");
      return;
    }

    const lastCheckpoint = await getLastCheckpoint(knex);
    let startBatch = 0;

    if (
      lastCheckpoint &&
      (lastCheckpoint.status === "running" || lastCheckpoint.status === "failed")
    ) {
      logger.info(`[INFO] Found checkpoint from previous run:`);
      logger.info(`  - Last batch: ${lastCheckpoint.last_batch_id}`);
      logger.info(`  - Records processed: ${lastCheckpoint.records_processed}`);
      logger.info(
        `  - Resuming from batch ${lastCheckpoint.last_batch_id + 1}...`
      );

      startBatch = lastCheckpoint.last_batch_id + 1;
      stats.processed = lastCheckpoint.records_processed;
      stats.updated = lastCheckpoint.records_inserted;
      stats.skipped = lastCheckpoint.records_skipped;
      stats.errored = lastCheckpoint.records_errored;
    }

    logger.info("📦 PROCESSING BATCHES");
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

      const records = await knex("social_contacts")
        .select("uuid_unique", "metadata")
        .whereNotNull("metadata")
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
        `[BATCH ${currentBatch + 1}] Completed | Processed: ${
          stats.processed
        } | Updated: ${stats.updated} | Skipped: ${stats.skipped} | Errors: ${
          stats.errored
        }`
      );

      currentBatch++;
    }

    logger.info("✅ POST-MIGRATION VALIDATION");
    logger.info("-".repeat(80));

    await validateNormalization(knex);

    await markCheckpointCompleted(knex, stats);

    if (checkpointTableCreated) {
      logger.info(
        "[CLEANUP] Removing checkpoints for this migration and dropping table..."
      );
      await knex("migration_checkpoints")
        .where({ migration_name: MIGRATION_NAME })
        .delete();
      await knex.schema.dropTable("migration_checkpoints");
      logger.info("[CLEANUP] Cleanup completed successfully");
    } else {
      logger.info(
        "[CLEANUP] Removing checkpoints for this migration only..."
      );
      await knex("migration_checkpoints")
        .where({ migration_name: MIGRATION_NAME })
        .delete();
      logger.info("[CLEANUP] Checkpoints removed successfully");
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    logger.info("=".repeat(80));
    logger.info("🎉 METADATA NORMALIZATION COMPLETED SUCCESSFULLY!");
    logger.info("=".repeat(80));
    logger.info("📊 FINAL REPORT:");
    logger.info(`  ⏱️  Duration: ${duration} seconds`);
    logger.info(`  📝 Total records processed: ${stats.processed}`);
    logger.info(`  ✅ Records updated: ${stats.updated}`);
    logger.info(`  ⏭️  Records skipped (already normalized): ${stats.skipped}`);
    logger.info(`  ❌ Records with errors: ${stats.errored}`);
    logger.info(
      `  📈 Success rate: ${((stats.updated / stats.processed) * 100).toFixed(
        2
      )}%`
    );
    logger.info("=".repeat(80));
  } catch (error) {
    logger.error("=".repeat(80));
    logger.error("❌ METADATA NORMALIZATION FAILED!");
    logger.error("=".repeat(80));
    logger.error("🔥 Error:", error.message);
    logger.error("📊 Stats at failure:");
    logger.error(`  - Processed: ${stats.processed}`);
    logger.error(`  - Updated: ${stats.updated}`);
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

    if (checkpointTableCreated) {
      try {
        logger.info(
          "[CLEANUP] Dropping migration_checkpoints table due to failure..."
        );
        await knex.schema.dropTable("migration_checkpoints");
      } catch (cleanupError) {
        logger.error(
          "Failed to cleanup migration_checkpoints table:",
          cleanupError.message
        );
      }
    }

    throw error;
  }
};

exports.down = async function () {
  logger.info("⚠️  Rolling back metadata normalization...");
  logger.warn(
    "This migration cannot be rolled back automatically - metadata has been normalized in place"
  );
  logger.warn(
    "Please restore from backup if you need to revert these changes"
  );
};
