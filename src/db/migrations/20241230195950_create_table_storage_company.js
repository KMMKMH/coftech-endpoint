const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "storage_company";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.bigInteger("quota").notNullable().defaultTo(524288000);
    table.bigInteger("available_space").notNullable();
    table.timestamps(true, true);

    table
      .foreign("company_id")
      .references("uuid_unique")
      .inTable("company")
      .onDelete("CASCADE");

    table.unique("company_id");
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
