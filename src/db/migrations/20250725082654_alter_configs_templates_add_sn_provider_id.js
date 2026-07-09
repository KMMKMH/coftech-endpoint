/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("configs_templates", function (table) {
    table.string("sn_provider_id", 255).after("extension_id").nullable();

    table
      .foreign("sn_provider_id")
      .references("uuid_unique")
      .inTable("social_networks_providers")
      .onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("configs_templates", function (table) {
    table.dropForeign("sn_provider_id");
    table.dropColumn("sn_provider_id");
  });
};
