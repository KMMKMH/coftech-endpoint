const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "store_items";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("name").notNullable();
    table.text("description", "longtext").notNullable();
    table.float("amount", 10, 2).unsigned().notNullable();
    table.string("currency_id").notNullable();
    table.json("images").notNullable();
    table.string("category_id").notNullable();
    table.string("type_id").notNullable();
    table.string("sku", 8).notNullable().unique();
    table.boolean("is_periodic").notNullable().defaultTo(false);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);

    table
      .foreign("category_id")
      .references("uuid_unique")
      .inTable("store_categories")
      .onDelete("RESTRICT");
    table
      .foreign("type_id")
      .references("uuid_unique")
      .inTable("store_types")
      .onDelete("RESTRICT");
    table
      .foreign("currency_id")
      .references("uuid_unique")
      .inTable("currencies")
      .onDelete("RESTRICT");

    table.unique(["name", "category_id", "type_id"]);
    table.index(["category_id", "type_id", "is_active"]);
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
