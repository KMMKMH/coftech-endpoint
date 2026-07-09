const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "raffle_lottery_participants";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("participant").notNullable();
    table.string("lottery_id").notNullable();
    table.boolean("status").notNullable().defaultTo(true);
    table.timestamps(true, true);

    table
      .foreign("participant")
      .references("uuid_unique")
      .inTable("raffle_users")
      .onDelete("CASCADE");

    table
      .foreign("lottery_id")
      .references("uuid_unique")
      .inTable("raffle_lottery")
      .onDelete("CASCADE");

    table.unique(["lottery_id", "participant"]);
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
