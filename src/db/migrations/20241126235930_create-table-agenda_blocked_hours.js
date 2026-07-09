const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "agenda_blocked_hours";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("account_id").nullable().defaultTo(null);
    table.date("blocked_date").nullable().defaultTo(null);
    table.json('blocked_days').nullable().defaultTo(null);
    table.time("start_time").notNullable();
    table.time("end_time").notNullable();
    table.boolean("is_global").defaultTo(false);
    table.boolean("is_permanent").defaultTo(false);
    table.string("reason").nullable().defaultTo(null);
    table.timestamps(true, true);
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
