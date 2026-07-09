const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "agenda_reserves_status";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("name").notNullable().unique();
    table.timestamps(true, true);
  });

  await knex.raw(up(tableName));

  const statuses = ["CANCELLED", "IN PROGRESS", "ACTIVE", "COMPLETED"];

  for (const status of statuses) {
    await knex(tableName).insert({ name: status });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTableIfExists(tableName);
};
