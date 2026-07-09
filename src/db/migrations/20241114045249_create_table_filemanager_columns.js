const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "filemanager_columns";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("table_id").notNullable();
    table.string("column_name").notNullable();
    table.string("column_type").notNullable();
    table
      .foreign("table_id")
      .references("uuid_unique")
      .inTable("filemanager_tables")
      .onDelete("CASCADE");
    table.timestamps(true, true);
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
