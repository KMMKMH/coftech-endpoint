const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "filemanager_tables";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("table_name").notNullable();
    table.string("base_id").notNullable();
    table.string("customer_table_name").notNullable();
    table
      .foreign("base_id")
      .references("uuid_unique")
      .inTable("filemanager_bases")
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
