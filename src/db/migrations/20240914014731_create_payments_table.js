const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "payments";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.increments("id").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("phone").notNullable();
    table.string("country").notNullable();
    table.string("email");
    table.string("bot_id").notNullable();
    table.string("status").notNullable();
    table.string("amount").notNullable();
    table.string("currency").notNullable().defaultTo("USD");
    table.string("reference").notNullable();
    table.string("callback_url");
    table.json("metadata");
    table.string("provider").notNullable();
    table.string("provider_response");
    table.string("provider_reference");
    table.timestamps(true, true);

    table.foreign("bot_id").references("uuid_unique").inTable("bots");
    table
      .foreign("provider")
      .references("uuid_unique")
      .inTable("payments_provider");
    table
      .foreign("status")
      .references("uuid_unique")
      .inTable("payments_status");
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
