const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "social_messages_queue";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("bot_id").notNullable();
    table.string("network_id").notNullable();
    table.longtext("message");
    table.string("message_type");
    table.timestamps(true, true);
    table.boolean("processed").defaultTo(false);

    table.foreign("bot_id").references("uuid_unique").inTable("bots");
    table.foreign("network_id").references("uuid_unique").inTable("social_networks");
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
