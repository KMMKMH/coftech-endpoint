const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "bots_extensions";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.string("uuid_unique").unique().notNullable();
    table.string("bot_id").notNullable();
    table.string("extension").notNullable();
    table.boolean("status").notNullable().defaultTo(true);
    table.timestamps(true, true);

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
