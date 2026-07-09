const tableName = "configs_templates";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const [extension] = await knex("extensions").where({
    key: "OPEN_AI_SERVICE",
  });

  await knex(tableName).insert({
    owner_type: "extension",
    key: "ADMIN_API_KEY",
    data_default: "",
    data_type: "string",
    description: "Admin API key for OpenAI",
    extension_id: extension.uuid_unique,
  });

  const [template] = await knex(tableName).where({
    key: "ADMIN_API_KEY",
  });
  
  const bots = await knex("bots");

  for (const bot of bots) {
    await knex("company_configs").insert({
      company_id: bot.company_id,
      bot_id: bot.uuid_unique,
      config_template_id: template.uuid_unique,
      data: template.data_default,
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const [template] = await knex(tableName).where({
    key: "ADMIN_API_KEY",
  });

  await knex("company_configs").where({
    config_template_id: template.uuid_unique,
  }).del();

  await knex(tableName).where({
    uuid_unique: template.uuid_unique,
  }).del();
};
