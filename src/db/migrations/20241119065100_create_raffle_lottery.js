const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "raffle_lottery";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("description").notNullable();
    table.string("company_id").notNullable();
    table.dateTime("start_date").notNullable();
    table.dateTime("end_date").notNullable();
    table.string("lottery_type").notNullable();
    table
      .enu("status", [
        "INACTIVE",
        "ACTIVE",
        "IN_PROGRESS",
        "STOPPED",
        "CANCELLED",
        "COMPLETED",
      ])
      .notNullable()
      .defaultTo("INACTIVE");
    table.timestamps(true, true);

    table
      .foreign("lottery_type")
      .references("uuid_unique")
      .inTable("raffle_lottery_types")
      .onDelete("CASCADE");

    table
      .foreign("company_id")
      .references("uuid_unique")
      .inTable("company")
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
