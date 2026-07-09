const tableName = "storage_logs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.table(tableName, function (table) {
    table.bigInteger("previous_space").nullable();
    table.bigInteger("remaining_space").nullable();
    table.dropForeign("account_id");
    table.dropUnique("account_id");
    table.dropColumn("timestamp");
    table.dropColumn("change_in_quota");
    table.bigInteger("file_size").nullable().alter();
    table.string("extension").after("file_name").nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.table(tableName, function (table) {
    table.timestamp("timestamp").defaultTo(knex.fn.now());
    table.dropColumn("change_in_quota");
    table.dropColumn("remaining_space");
    table.dropColumn("previous_space");
  });
};
