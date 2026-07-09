const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "recovery_password";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.increments("id").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("code").notNullable();
    table.timestamp('expiration_time').notNullable();
    table.enu('status', ['active', 'used', 'expired']).defaultTo('active');
    table.string("account_id").notNullable();
    table.timestamps(true, true);
    
    table.foreign("account_id").references("uuid_unique").inTable("accounts");
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
