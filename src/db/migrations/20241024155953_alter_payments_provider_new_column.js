const tableName = "payments_provider";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.string("extension_id");

    table
      .foreign("extension_id")
      .references("uuid_unique")
      .inTable("extensions");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("extension_id");
    table.dropColumn("extension_id");
  });
};
