const tableName = "short_url";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.renameColumn("url", "original_url");
    table.string("generated_url");
    table.string("expiration_time");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.renameColumn("original_url", "url");
    table.dropColumn("generated_url");
    table.dropColumn("expiration_time");
  });
};
