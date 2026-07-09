const tableName = "extensions";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.string("category").notNullable().defaultTo("UNCATEGORIZED");
  });

  await knex(tableName)
    .where("key", "SCREENSHOT_SERVICE")
    .update({ category: "WP_SUPPORT" });

  await knex(tableName)
    .where("key", "CUSTOMER_SUPPORT_WP")
    .update({ category: "WP_SUPPORT" });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn("category");
  });
};
