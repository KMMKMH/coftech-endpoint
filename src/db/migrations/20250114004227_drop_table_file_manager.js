const tableName = "file_manager";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const tableExists = await knex.schema.hasTable(tableName);
  if (tableExists) {
    await knex.schema.alterTable(tableName, function (table) {
      table.dropForeign("company_id");
    });
    await knex.schema.dropTableIfExists(tableName);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
