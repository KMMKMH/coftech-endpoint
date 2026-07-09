const { up, down } = require("../../utils/uuid_v4_trigger");

const tableName = "extra_bots_extensions";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("bot_id").notNullable();
    table.string("extension_id").notNullable();
    table.string("store_logs_id").nullable();
    table.boolean("status").notNullable().defaultTo(true);

    table
      .foreign("bot_id")
      .references("uuid_unique")
      .inTable("bots")
      .onDelete("CASCADE");

    table
      .foreign("extension_id")
      .references("uuid_unique")
      .inTable("extensions")
      .onDelete("CASCADE");

    table
      .foreign("store_logs_id")
      .references("uuid_unique")
      .inTable("store_logs")
      .onDelete("SET NULL");

    table.unique(["bot_id", "extension_id"]);
    table.index("bot_id");
    table.index("extension_id");
  });
  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists(tableName);
  await knex.raw(down(tableName));
};
