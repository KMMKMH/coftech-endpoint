/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const tableName = "filemanager_folders";

exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn("path");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, function (table) {
    table.string("path").after("name");
  });
};
