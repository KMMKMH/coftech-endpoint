const tableName = "payments_vault";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("accounts_cards", function (table) {
    table.dropForeign("customer_vault_id");
  });
  await knex.schema.dropTableIfExists(tableName);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
