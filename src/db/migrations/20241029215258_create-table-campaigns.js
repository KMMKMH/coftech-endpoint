const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "campaigns";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("bot_id").notNullable();
    table.string("name").notNullable();
    table.enu("type", ["UNIQUE", "RECURRENT"]).notNullable();
    table.string("cron").notNullable();
    table.string("message").nullable().defaultTo(null);
    table.string("media").nullable().defaultTo(null);
    table.string("source").notNullable();
    table.enu("status", ["ACTIVE", "IN_PROGRESS", "STOPPED", "CANCELLED", "COMPLETED"]).notNullable().defaultTo("ACTIVE");
    table.json("source_configs").notNullable();
    table.string("prev").nullable().defaultTo(null);
    table.string("next").nullable().defaultTo(null);
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
  await knex.schema.dropTable(tableName);
};
