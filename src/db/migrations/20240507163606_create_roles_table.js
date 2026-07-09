const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "roles";

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

  await knex(tableName).insert([
    { id: 1, key: "GUEST", name: "Guest" },
    { id: 2, key: "RESELLER", name: "Reseller" },
    { id: 3, key: "STAFF", name: "Staff" },
    { id: 4, key: "ADMIN", name: "Admin" },
    { id: 5, key: "SUPERADMIN", name: "SuperAdmin" },
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
