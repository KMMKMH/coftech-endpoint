const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "raffle_logs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("key").notNullable();
    table.longtext("data");
    table.string("reference").nullable();
    table.json("metadata");
    table.timestamps(true, true);

    table
      .foreign("company_id")
      .references("uuid_unique")
      .inTable("company");
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
