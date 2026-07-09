const tableName = 'campaigns_messages_history';
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.string("campaign_id").notNullable();
    table.string("source").notNullable();

    table.enu("status", ["DONE", "PENDING", "ERROR"]).notNullable().alter();

    table.renameColumn("noco_register_id", "source_register_id");

    table.dropColumn("noco_base_id");
    table.dropColumn("noco_table_id");

    table.foreign("campaign_id").references("uuid_unique").inTable("campaigns");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("campaign_id");
    table.dropColumn("campaign_id");
    table.dropColumn("source");

    table.string("status").notNullable().alter();

    table.renameColumn("source_register_id", "noco_register_id");

    table.string("noco_base_id").nullable();
    table.string("noco_table_id").nullable();
  });
};