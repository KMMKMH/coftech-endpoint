const tableName = "campaigns_messages_history";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("campaign_id");
    table.dropColumn("campaign_id");

    table.string("campaign_log_id").notNullable();
    table.foreign("campaign_log_id").references("uuid_unique").inTable("campaigns_logs");
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("campaign_log_id");
    table.dropColumn("campaign_log_id");

    table.string("campaign_id").notNullable();
    table.foreign("campaign_id").references("uuid_unique").inTable("campaigns");
  });
};
