const { up, down } = require("../../utils/uuid_v4_trigger");
const {
  createUpdatedAtTrigger,
  dropUpdatedAtTrigger,
} = require("../../utils/updatedAtTrigger");

const tableName = "social_networks_providers";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique", 255).unique().notNullable();
    table.string("key", 100).unique().notNullable();
    table.string("name", 200).notNullable();
    table.json("description").nullable();
    table.string("social_network_id", 255).notNullable();
    table.boolean("is_default").defaultTo(false);
    table.boolean("status").defaultTo(true);
    table.timestamps(true, true);

    table
      .foreign("social_network_id")
      .references("uuid_unique")
      .inTable("social_networks")
      .onDelete("CASCADE");
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
