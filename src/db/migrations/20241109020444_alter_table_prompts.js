const tableName = "prompts";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("bot_id");
    table.dropUnique(null, "prompts_bot_id_unique");
    table.integer("type").defaultTo(0);
  });

  await knex.schema.alterTable(tableName, (table) => {
    table.foreign("bot_id").references("bots.uuid_unique");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn("type");
    table.unique("bot_id");
  });
};
