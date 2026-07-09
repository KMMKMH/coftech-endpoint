const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "statistics_messages_count";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.date("date").notNullable();
    table.uuid("company_id").notNullable();
    table.string("company_name").notNullable();
    table.integer("count_receive").defaultTo(0).notNullable();
    table.integer("count_sent").defaultTo(0).notNullable();
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
