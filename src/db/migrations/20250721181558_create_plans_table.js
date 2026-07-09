const { up, down } = require("../../utils/uuid_v4_trigger");
const {
  createUpdatedAtTrigger,
  dropUpdatedAtTrigger,
} = require("../../utils/updatedAtTrigger");

const tableName = "plans";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("name").notNullable().unique();
    table.text("description", "mediumtext");
    table.decimal("price", 10, 2).notNullable().defaultTo(0);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.string("currency_id");
    table
      .foreign("currency_id")
      .references("uuid_unique")
      .inTable("currencies")
      .onDelete("SET NULL");
    table.timestamps(true, true);
  });
  await knex.raw(up(tableName));
  await knex.raw(createUpdatedAtTrigger(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.raw(dropUpdatedAtTrigger(tableName));
  await knex.schema.dropTable(tableName);
};
