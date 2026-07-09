const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "company_contact";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.increments("id").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("phone").unique().notNullable();
    table.string("name");
    table.string("company_id").notNullable();
    table.timestamps(true, true);
    
    table.foreign("company_id").references("uuid_unique").inTable("company");
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
