const tableName = "accounts_cards";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.string("company_id").notNullable();
    table.string("bot_id").notNullable();

    table.foreign("company_id").references("uuid_unique").inTable("company");
    table.foreign("bot_id").references("uuid_unique").inTable("bots");

    table.unique(["company_id", "bot_id", "customer_vault_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("company_id");
    table.dropForeign("bot_id");

    table.dropColumn("company_id");
    table.dropColumn("bot_id");

    table.dropUnique(["company_id", "bot_id", "customer_vault_id"]);
  });
};
