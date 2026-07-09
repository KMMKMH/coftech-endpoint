const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "call_center_departments";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("name").notNullable();
    table.text("description").nullable().defaultTo(null);
    table.boolean("status").defaultTo(true);
    table.string("category_id").notNullable();
    table.string("company_id").notNullable();
    table.string("bot_id").nullable().defaultTo(null);
    table.timestamps(true, true);

    table
      .foreign("category_id")
      .references("uuid_unique")
      .inTable("call_center_categories");
    table.foreign("bot_id").references("uuid_unique").inTable("bots");
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
  await knex.schema.dropTable(tableName);
};
