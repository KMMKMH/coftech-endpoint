/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const tableName = "filemanager_files";

exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn("status");
    table.bigint("size").after("extension").notNullable();
    table.string("folder").after("company_id");

    table
      .foreign("folder")
      .references("uuid_unique")
      .inTable("filemanager_folders")
      .onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, function (table) {
    table.boolean("status").notNullable().defaultTo(true);
    table.dropColumn("size");
  });
};
