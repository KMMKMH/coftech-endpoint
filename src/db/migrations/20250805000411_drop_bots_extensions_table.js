/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const tableExists = await knex.schema.hasTable("bots_extensions");

  if (tableExists) {
    await knex.schema.alterTable("bots_extensions", function (table) {
      table.dropForeign("bot_id");
      table.dropForeign("extension");
    });
  }
  await knex.schema.dropTableIfExists("bots_extensions");
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
