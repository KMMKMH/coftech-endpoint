const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "payments_status";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.increments("id").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("name").notNullable();
    table.timestamps(true, true);
  });

  await knex.raw(up(tableName));

  await knex(tableName).insert([
    {
      name: "pending",
    },
    {
      name: "failed",
    },
    {
      name: "success",
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
