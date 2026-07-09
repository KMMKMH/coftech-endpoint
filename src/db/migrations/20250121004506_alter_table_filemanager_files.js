const tableName = "filemanager_files";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.table(tableName, (table) => {
    table.string("bucket").nullable().after("source");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.table(tableName, (table) => {
    table.dropColumn("bucket");
  });
};
