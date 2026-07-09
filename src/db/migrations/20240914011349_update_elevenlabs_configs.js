const elevenlabsConfigs = [];
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const [extension] = await knex("extensions").where({
    key: "ELEVENLABS",
  })

  const bots_with_elevenlabs = await knex("bots_extensions").select("bot_id").where("extension", extension.uuid_unique);

  for (const bot of bots_with_elevenlabs) {
    for (const config of elevenlabsConfigs) {
      const [elevenlabs_config] = await knex("company_configs").where({
        bot_id: bot.bot_id,
        extension: extension.uuid_unique,
        key: config.key,
      });

      if (!elevenlabs_config) {
        const [bot_company] = await knex("bots").select("company_id").where("uuid_unique", bot.bot_id);

        await knex("company_configs").insert({
          company_id: bot_company.company_id,
          bot_id: bot.bot_id,
          extension: extension.uuid_unique,
          ...config,
        });
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex("company_configs").where("key", "ELEVENLABS_MODEL").del();
  await knex("company_configs").where("key", "ELEVENLABS_LANGUAGE").del();
};
