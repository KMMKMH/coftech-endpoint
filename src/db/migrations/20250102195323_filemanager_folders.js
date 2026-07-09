const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "filemanager_folders";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("parent_folder").nullable();
    table.string("name").notNullable();
    table.string("path").notNullable();
    table.boolean("is_root").notNullable().defaultTo(false);
    table.timestamps(true, true);

    table
      .foreign("company_id")
      .references("uuid_unique")
      .inTable("company")
      .onDelete("CASCADE");

    table
      .foreign("parent_folder")
      .references("uuid_unique")
      .inTable(tableName)
      .onDelete("CASCADE");
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
