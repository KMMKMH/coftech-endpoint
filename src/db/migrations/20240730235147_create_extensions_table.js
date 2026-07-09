const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.increments("id").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("key").unique().notNullable();
    table.string("name").notNullable();
    table.boolean("status").notNullable().defaultTo(true);
  });

  await knex.raw(up(tableName));

  await knex(tableName).insert([
    { key: "SCREENSHOT_WORD", name: "Screenshot a palabra clave" },
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
