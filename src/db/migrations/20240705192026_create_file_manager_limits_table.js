const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "file_manager_limits";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.integer("limit").unsigned().notNullable().defaultTo(10);

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
