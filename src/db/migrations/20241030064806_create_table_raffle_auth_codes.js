const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "raffle_auth_codes";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.increments("id").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("code").notNullable();
    table.string("phone").notNullable();
    table.timestamp("expiration_time").notNullable();
    table.enu("status", ["active", "used", "expired"]).defaultTo("active");
    table.timestamps(true, true);

    table
      .foreign("phone")
      .references("phone")
      .inTable("raffle_users")
      .onDelete("CASCADE");
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
