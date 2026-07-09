const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "role_permissions";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table
      .string("role_id")
      .notNullable()
      .references("uuid_unique")
      .inTable("roles")
      .onDelete("CASCADE");
    table.string("route_key").notNullable();
    table.timestamps(true, true);
    table.unique(["role_id", "route_key"]);
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTableIfExists(tableName);
};
