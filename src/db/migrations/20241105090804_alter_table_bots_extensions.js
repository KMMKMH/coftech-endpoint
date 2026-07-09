const tableName = "bots_extensions";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const companyField = await knex("company").select("uuid_unique").first();

  const botField = await knex("bots")
    .where({ "bots.company_id": companyField.uuid_unique })
    .first();

  const [extensionField] = await knex("extensions").where({
    key: "WHATSAPP_CALL_CONTROL",
  });

  const existingExtension = await knex(tableName)
    .where({
      bot_id: botField.uuid_unique,
      extension: extensionField.uuid_unique,
    })
    .first();

  if (!existingExtension) {
    await knex(tableName).insert({
      bot_id: botField.uuid_unique,
      extension: extensionField.uuid_unique,
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const companyField = await knex("company").select("uuid_unique").first();

  const botField = await knex("bots")
    .where({ "bots.company_id": companyField.uuid_unique })
    .first();

  const [extensionField] = await knex("extensions").where({
    key: "WHATSAPP_CALL_CONTROL",
  });

  await knex(tableName)
    .where({
      bot_id: botField.uuid_unique,
      extension: extensionField.uuid_unique,
    })
    .del();
};
