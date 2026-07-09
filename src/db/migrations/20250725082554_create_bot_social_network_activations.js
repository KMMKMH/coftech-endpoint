const { up, down } = require("../../utils/uuid_v4_trigger");
const {
  createUpdatedAtTrigger,
  dropUpdatedAtTrigger,
} = require("../../utils/updatedAtTrigger");

const tableName = "bot_social_network_activations";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique", 255).unique().notNullable();
    table.string("bot_id", 255).notNullable();
    table.string("social_network_id", 255).nullable();
    table.string("sn_provider_id", 255).nullable();
    table.string("store_log_id", 255).nullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamp("activation_date").defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table
      .foreign("bot_id")
      .references("uuid_unique")
      .inTable("bots")
      .onDelete("CASCADE");

    table
      .foreign("social_network_id")
      .references("uuid_unique")
      .inTable("social_networks")
      .onDelete("SET NULL");

    table
      .foreign("sn_provider_id")
      .references("uuid_unique")
      .inTable("social_networks_providers")
      .onDelete("SET NULL");

    table
      .foreign("store_log_id")
      .references("uuid_unique")
      .inTable("store_logs")
      .onDelete("SET NULL");

    table.unique(["bot_id", "social_network_id"]);
  });

  await knex.raw(up(tableName));
  await knex.raw(createUpdatedAtTrigger(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.raw(dropUpdatedAtTrigger(tableName));
  await knex.schema.dropTable(tableName);
};
