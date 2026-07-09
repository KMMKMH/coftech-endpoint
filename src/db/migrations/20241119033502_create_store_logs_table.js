const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "store_logs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("store_item_id").notNullable();
    table.string("company_id").nullable().defaultTo(null);
    table.string("bot_id").nullable().defaultTo(null);
    table.timestamp("purchase_date").defaultTo(knex.fn.now());
    table.timestamp("activation_date").nullable();
    table.timestamp("renewal_date").nullable();
    table.integer("quantity").notNullable().defaultTo(1);
    table.float("total_price").notNullable();
    table.boolean("status").notNullable().defaultTo(true);
    table.json("metadata").nullable().defaultTo(null);
    table.timestamps(true, true);

    table.unique(["store_item_id", "bot_id"]);
    table.index(["store_item_id", "company_id", "bot_id"]);
    table
      .foreign("store_item_id")
      .references("uuid_unique")
      .inTable("store_items");
    table.foreign("company_id").references("uuid_unique").inTable("company");
    table.foreign("bot_id").references("uuid_unique").inTable("bots");
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
