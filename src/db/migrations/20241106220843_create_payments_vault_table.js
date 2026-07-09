const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "payments_vault";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.string("uuid_unique").unique().notNullable();
    table.string("customer_id").unique().notNullable();
    table.string("phone").unique().notNullable();
    table.timestamps(true, true);
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
