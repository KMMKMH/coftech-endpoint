const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "social_messages";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("network_id").notNullable();
    table.string("message_id");
    table.boolean("is_group").defaultTo(true);
    table.boolean("is_broadcast").defaultTo(false);
    table.longtext("body").notNullable();
    table.longtext("data");
    table.string("type").defaultTo("text");
    table.string("sender");
    table.string("via").defaultTo("receive");
    table.string("to_send");
    table.string("author");
    table.longtext("extra1");
    table.longtext("extra2");
    table.longtext("extra3");
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
    table
      .foreign("network_id")
      .references("uuid_unique")
      .inTable("social_networks");
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
