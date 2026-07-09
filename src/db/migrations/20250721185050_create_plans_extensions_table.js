const { up, down } = require("../../utils/uuid_v4_trigger");

const tableName = "plans_extensions";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.string("uuid_unique").primary();
    table.string("plan_id").notNullable();
    table.string("extension_id").notNullable();
    table.unique(["plan_id", "extension_id"]);
    table
      .foreign("plan_id")
      .references("uuid_unique")
      .inTable("plans")
      .onDelete("CASCADE");
    table
      .foreign("extension_id")
      .references("uuid_unique")
      .inTable("extensions")
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
