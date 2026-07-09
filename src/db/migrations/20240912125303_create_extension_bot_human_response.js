const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex(tableName).insert({
    key: "BOT_HUMAN_RESPONSE",
    name: "Bot Human Response",
    icon: "FaUserShield",
  });

  const [extension] = await knex(tableName).where({
    key: "BOT_HUMAN_RESPONSE",
  });
  
  const bots = await knex("bots").select("uuid_unique", "company_id");

  for (const bot of bots) {
    await knex("bots_extensions").insert({
      bot_id: bot.uuid_unique,
      extension: extension.uuid_unique,
    });

    const botHumanResponseConfigs = []
    for (const config of botHumanResponseConfigs) {
      await knex("company_configs").insert({
        bot_id: bot.uuid_unique,
        company_id: bot.company_id,
        extension: extension.uuid_unique,
        ...config,
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const [extension] = await knex(tableName).where({
    key: "BOT_HUMAN_RESPONSE",
  });

  await knex("bots_extensions").where("extension", extension.uuid_unique).del();
  await knex("company_configs").where("extension", extension.uuid_unique).del();
  await knex(tableName).where("uuid_unique", extension.uuid_unique).del();
};
