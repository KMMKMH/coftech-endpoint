const tableName = "accounts_cards";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("company_id");
    table.dropForeign("bot_id");

    table.dropColumn("company_id");
    table.dropColumn("bot_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
