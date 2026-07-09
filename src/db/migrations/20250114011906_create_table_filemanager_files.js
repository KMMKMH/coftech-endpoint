const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "filemanager_files";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("name").notNullable();
    table.string("path").notNullable();
    table.string("extension").notNullable();
    table.string("source").notNullable().defaultTo("filemanager");
    table.boolean("status").notNullable().defaultTo(true);
    table.bigint("identificator").unique().notNullable();
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
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
