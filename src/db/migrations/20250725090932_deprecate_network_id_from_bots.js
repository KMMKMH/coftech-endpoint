/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("bots", function (table) {
    table.dropForeign("network_id", "bots_network_id_foreign");
  });

  await knex.schema.alterTable("bots", function (table) {
    table.dropColumn("network_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex("bot_social_network_activations").del();

  await knex.schema.alterTable("bots", function (table) {
    table.string("network_id", 255).nullable();
  });

  const socialNetwork = await knex("social_networks")
    .select("uuid_unique")
    .first();

  if (socialNetwork) {
    await knex("bots").update({
      network_id: socialNetwork.uuid_unique
    });
  }

  await knex.schema.alterTable("bots", function (table) {
    table
      .foreign("network_id", "bots_network_id_foreign")
      .references("uuid_unique")
      .inTable("social_networks")
      .onDelete("CASCADE");
  });
};
