const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "customer_support_logs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("bot_id").notNullable();
    table.string("account_id").nullable();
    table.enu("status", ["STARTED", "IN_PROGRESS", "FINISHED", "EXPIRED", "REASSIGNING"]).defaultTo("STARTED").notNullable();
    table.string("chat_id").notNullable();
    table.string("group_id").notNullable();
    table.datetime("started_at").notNullable();
    table.datetime("ended_at").nullable().defaultTo(null);
    table.json("metadata").defaultTo(null);
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
    table.foreign("bot_id").references("uuid_unique").inTable("bots");
    table.foreign("account_id").references("uuid_unique").inTable("accounts");
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
