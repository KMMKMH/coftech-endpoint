const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "agenda_reserves_logs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.uuid("company_id").notNullable();
    table.string("agenda_reserve_id").notNullable();
    table.json("data").notNullable();
    
    table.timestamps(true, true);
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
