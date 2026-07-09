/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("social_networks", function (table) {
    table.string("store_item_id", 255).nullable();
    table.boolean("is_default").defaultTo(false);

    table
      .foreign("store_item_id")
      .references("uuid_unique")
      .inTable("store_items")
      .onDelete("SET NULL");
  });

  await knex("social_networks")
    .where("key", "WHATSAPP")
    .update({ is_default: true });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("social_networks", function (table) {
    table.dropForeign("store_item_id");
    table.dropColumn("store_item_id");
    table.dropColumn("is_default");
  });
};
