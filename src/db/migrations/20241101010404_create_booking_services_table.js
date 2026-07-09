const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "booking_services";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("name").notNullable();
    table.string("description").nullable().defaultTo(null);
    table.time("duration").nullable().defaultTo(null);
    table.string("price").nullable().defaultTo(0);
    table.string("currency").notNullable().defaultTo("USD");
    table.boolean("is_active").nullable().defaultTo(true);
    table.string("author_id").notNullable();
    table.timestamps(true, true);

    table.foreign("author_id").references("uuid_unique").inTable("accounts");
    table.unique(["name", "author_id"]);
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
