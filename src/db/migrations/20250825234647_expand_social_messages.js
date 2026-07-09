const tableName = "social_messages";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const whatsattProvider = await knex("social_networks_providers")
    .where({
      key: "web-whatsapp",
    })
    .first();

  if (!whatsattProvider) {
    throw new Error("WhatsApp provider not found");
  }

  await knex.schema.alterTable(tableName, (table) => {
    table.string("sn_provider_id").nullable();
  });

  await knex(tableName).update({
    sn_provider_id: whatsattProvider.uuid_unique,
  });

  await knex.schema.alterTable(tableName, (table) => {
    table.string("sn_provider_id").notNullable().alter();
  });

  await knex.schema.alterTable(tableName, (table) => {
    table
      .foreign("sn_provider_id")
      .references("uuid_unique")
      .inTable("social_networks_providers");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  if (await knex.schema.hasColumn(tableName, "sn_provider_id")) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropForeign(["sn_provider_id"]);
      table.dropColumn("sn_provider_id");
    });
  }
};
