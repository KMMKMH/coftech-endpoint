const logger = require("../../utils/logger");

async function getForeignKeys(knex) {
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

  return fks[0];
}

async function dropForeignKey(knex, tableName, constraintName) {
  logger.info(`  - Dropping FK: ${tableName}.${constraintName}`);
  await knex.raw(`ALTER TABLE ${tableName} DROP FOREIGN KEY ${constraintName}`);
}

async function createForeignKey(knex, fk) {
  logger.info(
    `  - Creating FK: ${fk.referencing_table}.${fk.referencing_column} -> social_contacts.${fk.referenced_column}`
  );

  const newConstraintName = `${fk.constraint_name}_new`;

  await knex.raw(`
    ALTER TABLE ${fk.referencing_table}
    ADD CONSTRAINT ${newConstraintName}
    FOREIGN KEY (${fk.referencing_column})
    REFERENCES social_contacts(${fk.referenced_column})
    ON DELETE CASCADE
    ON UPDATE CASCADE
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  logger.info("=".repeat(80));
  logger.info("🚀 PHASE 2: UPDATE FOREIGN KEY REFERENCES");
  logger.info("=".repeat(80));

  try {
    logger.info("🔍 Finding foreign keys referencing social_contacts_old...");

    const foreignKeys = await getForeignKeys(knex);

    if (foreignKeys.length === 0) {
      logger.info("✅ No foreign keys found referencing social_contacts_old");
      logger.info("Nothing to update. Migration complete.");
      return;
    }

    logger.info(`📊 Found ${foreignKeys.length} foreign key(s) to update:`);
    foreignKeys.forEach((fk) => {
      logger.info(
        `  - ${fk.referencing_table}.${fk.referencing_column} (${fk.constraint_name})`
      );
    });

    logger.info("");
    logger.info("🔄 Step 1: Dropping old foreign keys...");
    logger.info("-".repeat(80));

    for (const fk of foreignKeys) {
      await dropForeignKey(knex, fk.referencing_table, fk.constraint_name);
    }

    logger.info("✅ All old foreign keys dropped");
    logger.info("");
    logger.info("➕ Step 2: Creating new foreign keys to social_contacts...");
    logger.info("-".repeat(80));

    for (const fk of foreignKeys) {
      await createForeignKey(knex, fk);
    }

    logger.info("✅ All new foreign keys created");
    logger.info("");
    logger.info("=".repeat(80));
    logger.info("🎉 FOREIGN KEY UPDATE COMPLETED SUCCESSFULLY!");
    logger.info("=".repeat(80));
    logger.info("");
    logger.info("⚠️  NEXT STEPS:");
    logger.info(
      "  - Run the final migration to drop social_contacts_old table"
    );
    logger.info("");
  } catch (error) {
    logger.error("=".repeat(80));
    logger.error("❌ FOREIGN KEY UPDATE FAILED!");
    logger.error("=".repeat(80));
    logger.error("🔥 Error:", error.message);
    logger.error("");
    logger.error("⚠️  The foreign keys may be in an inconsistent state.");
    logger.error("⚠️  You may need to manually review and fix them.");
    logger.error("=".repeat(80));

    throw error;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  logger.info("⚠️  Rolling back foreign key changes...");
  logger.info(
    "This will revert foreign keys to point back to social_contacts_old"
  );

  try {
    const foreignKeys = await knex.raw(`
      SELECT 
        TABLE_NAME as referencing_table,
        COLUMN_NAME as referencing_column,
        CONSTRAINT_NAME as constraint_name,
        REFERENCED_COLUMN_NAME as referenced_column
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME = 'social_contacts'
        AND CONSTRAINT_NAME LIKE '%_new'
    `);

    for (const fk of foreignKeys[0]) {
      logger.info(
        `  - Reverting FK: ${fk.referencing_table}.${fk.constraint_name}`
      );

      await knex.raw(
        `ALTER TABLE ${fk.referencing_table} DROP FOREIGN KEY ${fk.constraint_name}`
      );

      const oldConstraintName = fk.constraint_name.replace("_new", "");
      await knex.raw(`
        ALTER TABLE ${fk.referencing_table}
        ADD CONSTRAINT ${oldConstraintName}
        FOREIGN KEY (${fk.referencing_column})
        REFERENCES social_contacts_old(${fk.referenced_column})
        ON DELETE CASCADE
        ON UPDATE CASCADE
      `);
    }

    logger.info("✅ Foreign keys reverted to social_contacts_old");
  } catch (error) {
    logger.error("❌ Rollback failed:", error.message);
    throw error;
  }
};
