const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "bots_refresh_tokens";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("bot_id").nullable().unique();
    table.string("refresh_token").nullable();
    table.json("credentials").nullable();
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
  await knex.schema.dropTable(tableName);
};
