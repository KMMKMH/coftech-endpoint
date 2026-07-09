const logger = require("../../utils/logger");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const tableExists = await knex.schema.hasTable("migration_checkpoints");

  if (!tableExists) {
    logger.info("Table migration_checkpoints does not exist. Nothing to drop.");
    return;
  }

  await knex.schema.dropTable("migration_checkpoints");

  logger.info("Table migration_checkpoints dropped successfully");
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
// eslint-disable-next-line no-unused-vars
exports.down = async function (knex) {
  logger.info(
    "donting anything on down for drop_table_migration_checkpoints.js"
  );
};
