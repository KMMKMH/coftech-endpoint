const logger = require("../../utils/logger");

async function checkForeignKeys(knex) {
  logger.info(
    "[PRE-CHECK] 🔍 Checking for foreign keys referencing social_contacts_old..."
  );

  const fks = await knex.raw(`
    SELECT 
      TABLE_NAME as referencing_table,
      COLUMN_NAME as referencing_column,
      CONSTRAINT_NAME as constraint_name,
      REFERENCED_TABLE_NAME as referenced_table,
      REFERENCED_COLUMN_NAME as referenced_column
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
      AND REFERENCED_TABLE_NAME = 'social_contacts_old'
  `);

  if (fks[0].length > 0) {
    logger.error(
      "[PRE-CHECK] ❌ Found foreign keys referencing social_contacts_old:"
    );
    fks[0].forEach((fk) => {
      logger.error(
        `  - ${fk.referencing_table}.${fk.referencing_column} -> ${fk.referenced_table}.${fk.referenced_column}`
      );
    });
    throw new Error(
      "Cannot proceed: Foreign keys are still referencing social_contacts_old. Run migration step 2 first."
    );
  }

  logger.info(
    "[PRE-CHECK] ✅ No foreign keys found referencing social_contacts_old"
  );
  return true;
}

async function checkTriggersAndProcedures(knex) {
  logger.info("[PRE-CHECK] 🔍 Checking for triggers on social_contacts_old...");

  const triggers = await knex.raw(`
    SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
    FROM information_schema.TRIGGERS
    WHERE EVENT_OBJECT_SCHEMA = DATABASE()
      AND EVENT_OBJECT_TABLE = 'social_contacts_old'
  `);

  if (triggers[0].length > 0) {
    logger.warn("[PRE-CHECK] ⚠️  Found triggers on social_contacts_old:");
    triggers[0].forEach((t) => {
      logger.warn(`  - ${t.TRIGGER_NAME} (${t.EVENT_MANIPULATION})`);
    });
    throw new Error(
      "Cannot proceed: Triggers found on social_contacts_old. Remove them first."
    );
  }

  logger.info("[PRE-CHECK] ✅ No triggers found on social_contacts_old");

  logger.info(
    "[PRE-CHECK] 🔍 Checking for stored procedures referencing social_contacts_old..."
  );

  const procedures = await knex.raw(`
    SELECT ROUTINE_NAME, ROUTINE_TYPE
    FROM information_schema.ROUTINES
    WHERE ROUTINE_SCHEMA = DATABASE()
      AND ROUTINE_DEFINITION LIKE '%social_contacts_old%'
  `);

  if (procedures[0].length > 0) {
    logger.warn(
      "[PRE-CHECK] ⚠️  Found stored procedures referencing social_contacts_old:"
    );
    procedures[0].forEach((p) => {
      logger.warn(`  - ${p.ROUTINE_NAME} (${p.ROUTINE_TYPE})`);
    });
    throw new Error(
      "Cannot proceed: Stored procedures reference social_contacts_old. Review them first."
    );
  }

  logger.info(
    "[PRE-CHECK] ✅ No stored procedures found referencing social_contacts_old"
  );
  return true;
}

async function verifyDataIntegrity(knex) {
  logger.info("[VERIFY] 🔍 Verifying data integrity before dropping table...");

  const oldCount = await knex("social_contacts_old").count("* as total");
  const newCount = await knex("social_contacts").count("* as total");

  const totalOld = parseInt(oldCount[0].total);
  const totalNew = parseInt(newCount[0].total);

  logger.info(`[VERIFY] 📊 Record counts:`);
  logger.info(`  - social_contacts_old: ${totalOld}`);
  logger.info(`  - social_contacts: ${totalNew}`);

  if (totalNew < totalOld) {
    throw new Error(
      `Data integrity check failed: social_contacts has fewer records (${totalNew}) than social_contacts_old (${totalOld})`
    );
  }

  logger.info("[VERIFY] ✅ Data integrity check passed");
  return true;
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  logger.info("=".repeat(80));
  logger.info("🚀 PHASE 3: DROP OLD TABLE social_contacts_old");
  logger.info("=".repeat(80));

  try {
    logger.info("📋 PRE-DROP SAFETY CHECKS");
    logger.info("-".repeat(80));

    await checkForeignKeys(knex);

    await checkTriggersAndProcedures(knex);

    await verifyDataIntegrity(knex);

    logger.info("");
    logger.info("🗑️  DROPPING TABLE");
    logger.info("-".repeat(80));

    const tableExists = await knex.schema.hasTable("social_contacts_old");

    if (!tableExists) {
      logger.info(
        "⚠️  Table social_contacts_old does not exist. Nothing to drop."
      );
      return;
    }

    logger.info("🗑️  Dropping table social_contacts_old...");
    await knex.schema.dropTable("social_contacts_old");
    logger.info("✅ Table social_contacts_old dropped successfully");

    logger.info("");
    logger.info("=".repeat(80));
    logger.info("🎉 MIGRATION COMPLETED SUCCESSFULLY!");
    logger.info("=".repeat(80));
    logger.info("✅ The old table 'social_contacts_old' has been removed");
    logger.info("✅ All data is now in 'social_contacts'");
    logger.info("✅ All foreign keys point to 'social_contacts'");
    logger.info("=".repeat(80));
  } catch (error) {
    logger.error("=".repeat(80));
    logger.error("❌ DROP TABLE FAILED!");
    logger.error("=".repeat(80));
    logger.error("🔥 Error:", error.message);
    logger.error("");
    logger.error("⚠️  The table 'social_contacts_old' has NOT been dropped.");
    logger.error("⚠️  Please review the error and ensure:");
    logger.error("    1. All foreign keys have been migrated (run step 2)");
    logger.error("    2. No triggers or procedures reference the old table");
    logger.error("    3. Data integrity is maintained");
    logger.error("=".repeat(80));

    throw error;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
// eslint-disable-next-line no-unused-vars
exports.down = async function (knex) {
  logger.error("=".repeat(80));
  logger.error("⚠️  WARNING: ROLLBACK NOT SUPPORTED");
  logger.error("=".repeat(80));
  logger.error("The table 'social_contacts_old' has been permanently dropped.");
  logger.error("To restore it, you would need to:");
  logger.error("  1. Restore from a database backup");
  logger.error(
    "  2. OR recreate the table and copy data back from social_contacts"
  );
  logger.error("");
  logger.error("This rollback operation is NOT automated for safety reasons.");
  logger.error("=".repeat(80));

  throw new Error(
    "Rollback not supported for this migration. Restore from backup if needed."
  );
};
