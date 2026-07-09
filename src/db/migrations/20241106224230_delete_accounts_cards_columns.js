const tableName = "accounts_cards";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn("source");

    table
      .foreign("customer_vault_id")
      .references("customer_id")
      .inTable("payments_vault");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
