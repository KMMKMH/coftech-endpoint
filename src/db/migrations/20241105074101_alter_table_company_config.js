const tableName = "company_configs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const companies = await knex("company").select("uuid_unique");
  const extension = await knex("extensions")
    .where({ key: "WHATSAPP_CALL_CONTROL" })
    .select("uuid_unique")
    .first();

  const configs = [
    {
      key: "WHATSAPP_ALLOW_CALL_STATUS",
      data: false,
      data_type: "boolean",
      description: "enables or disables WhatsApp call reception",
    },
    {
      key: "WHATSAPP_MSG_CALL",
      data: "Calls are currently disabled.",
      data_type: "string",
      description: "WhatsApp message call configuration",
    },
  ];

  for (const company of companies) {
    const bot = await knex("bots")
      .where({ company_id: company.uuid_unique })
      .select("uuid_unique")
      .first();

    for (const config of configs) {
      const existingConfig = await knex(tableName)
        .where({
          key: config.key,
          company_id: company.uuid_unique,
        })
        .first();

      if (!existingConfig) {
        await knex(tableName).insert({
          key: config.key,
          data: config.data,
          data_type: config.data_type,
          company_id: company.uuid_unique,
          bot_id: bot ? bot.uuid_unique : null,
          description: config.description,
          extension: extension ? extension.uuid_unique : null,
        });
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const configs = [
    {
      key: "WHATSAPP_ALLOW_CALL_STATUS",
    },
    {
      key: "WHATSAPP_MSG_CALL",
    },
  ];

  for (const config of configs) {
    await knex(tableName)
      .where({
        key: config.key,
      })
      .del();
  }
};
