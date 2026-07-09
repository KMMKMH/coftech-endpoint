const tableName = "configs_templates"

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const config = await knex(tableName).where({ key: "GPT_TEMPERATURE" }).first();

  await knex("company_configs").where({ config_template_id: config.uuid_unique }).del();
  await knex(tableName).where({ uuid_unique: config.uuid_unique }).del();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const extension = await knex("extensions").where({ key: "OPEN_AI_SERVICE" }).first();

  const [templateID] = await knex(tableName).insert({
    owner_type: "extension",
    key: "GPT_TEMPERATURE",
    data_default: 1,
    data_type: "float",
    data_options: JSON.stringify({ max: 2, min: 0 }),
    description: "Set the temperature of the GPT",
    extension_id: extension.uuid_unique,
  });

  const templateField = await knex(tableName).where({ id: templateID }).first();
  const bots = await knex("bots");

  for (const bot of bots) {
    await knex("company_configs").insert({
      company_id: bot.company_id,
      bot_id: bot.uuid_unique,
      config_template_id: templateField.uuid_unique,
      data: 1,
    });
  }
};
