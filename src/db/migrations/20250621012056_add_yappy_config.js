const tableName = "extensions";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const [extension] = await knex(tableName).where({ key: "YAPPY" });

  if (!extension) throw new Error("Extension YAPPY not found");

  await knex("configs_templates").insert({
    owner_type: "extension",
    key: "YAPPY_URL_DOMAIN",
    data_default: "",
    data_type: "string",
    description:
      "The domain must match the one configured in your Yappy payment button.",
    extension_id: extension.uuid_unique,
  });

  const [insertedConfig] = await knex("configs_templates").where({
    key: "YAPPY_URL_DOMAIN",
    extension_id: extension.uuid_unique,
  });

  const bots = await knex("bots_extensions")
    .where({ extension: extension.uuid_unique })
    .join("bots", "bots.uuid_unique", "bots_extensions.bot_id")
    .select("bots.uuid_unique as bot_id", "bots.company_id");

  for (const bot of bots) {
    const [exists] = await knex("company_configs").where({
      bot_id: bot.bot_id,
      company_id: bot.company_id,
      config_template_id: insertedConfig.uuid_unique,
    });

    if (!exists) {
      await knex("company_configs").insert({
        bot_id: bot.bot_id,
        company_id: bot.company_id,
        config_template_id: insertedConfig.uuid_unique,
        data: insertedConfig.data_default,
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const [template] = await knex("configs_templates").where({
    key: "YAPPY_URL_DOMAIN",
  });

  if (!template) return;

  await knex("company_configs")
    .where({ config_template_id: template.uuid_unique })
    .del();

  await knex("configs_templates")
    .where({ uuid_unique: template.uuid_unique })
    .del();
};
