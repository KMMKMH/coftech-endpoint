const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "agenda_links";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("reserve_id").notNullable();
    table.string("key").notNullable();
    table.boolean("status").defaultTo(true).notNullable();
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
    table.foreign("reserve_id").references("uuid_unique").inTable("agenda_reserves").onDelete("CASCADE");
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
