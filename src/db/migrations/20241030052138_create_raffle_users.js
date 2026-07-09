const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "raffle_users";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("full_name");
    table.string("phone").unique().notNullable();
    table.string("email").unique();
    table.boolean("is_active").defaultTo(0).notNullable();
    table.json("metadata");
    table.timestamps(true, true);
    table.index("phone");
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
