const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "raffle_roles";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("key").notNullable().unique();
    table.string("name").notNullable().unique();
  });

  await knex.raw(up(tableName));

  await knex(tableName).insert([{ id: 1, key: "ADMIN", name: "Admin" }]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
