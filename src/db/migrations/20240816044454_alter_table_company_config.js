const tableName = "company_configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.string("bot_id").nullable();
  });

  const company = await knex("company").select("uuid_unique").first();
  const bot = await knex("bots")
    .where({ company_id: company.uuid_unique })
    .select("uuid_unique")
    .first();

  const configs = [
    "OPENAI_KEY",
    "WP_GROUP_SUPPORT",
    "GPT_MODEL",
    "HUMANIZE_RESPONSE",
    "SCREENSHOT_WORD",
  ];

  for (const config of configs) {
    const existingConfig = await knex(tableName)
      .where({
        key: config,
        company_id: company.uuid_unique,
      })
      .first();

    if (existingConfig) {
      await knex(tableName)
        .where({
          company_id: company.uuid_unique,
          key: config,
        })
        .update({ bot_id: bot.uuid_unique });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn("bot_id");
  });
};
