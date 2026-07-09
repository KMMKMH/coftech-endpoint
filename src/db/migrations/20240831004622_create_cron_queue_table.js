const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "cron_queue_table";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.increments("id").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("bot_id").notNullable();
    table.string("key").notNullable();
    table.boolean("status").notNullable().defaultTo(false);
    table.string("cron").notNullable();
    table.string("prev").notNullable();
    table.string("next").notNullable();
    table.string("type").notNullable();
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
    table.foreign("bot_id").references("uuid_unique").inTable("bots");
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
