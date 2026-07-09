/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("social_networks_providers", function (table) {
    table.boolean("is_required_configs").nullable();
  });

  await knex("social_networks_providers")
    .update("is_required_configs", true)
    .where({ key: "meta" });

  await knex("social_networks_providers")
    .update("is_required_configs", false)
    .where({ key: "web-whatsapp" });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("social_networks_providers", function (table) {
    table.dropColumn("is_required_configs");
  });
};
