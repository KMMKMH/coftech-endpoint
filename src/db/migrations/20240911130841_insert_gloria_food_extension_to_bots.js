const gloriaFoodConfigs = [];
const tableName = "bots_extensions";
const configTableName = "company_configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const bots = await knex("bots").select("uuid_unique", "company_id");
  const [extension] = await knex("extensions").where({
    key: "GLORIA_FOOD",
  });

  for (const bot of bots) {
    const existingBotExtension = await knex(tableName)
      .where({
        bot_id: bot.uuid_unique,
        extension: extension.uuid_unique,
      })
      .first();

    if (!existingBotExtension) {
      await knex(tableName).insert({
        bot_id: bot.uuid_unique,
        extension: extension.uuid_unique,
      });
    }

    for (const config of gloriaFoodConfigs) {
      const existingConfig = await knex(configTableName)
        .where({
          key: config.key,
          bot_id: bot.uuid_unique,
        })
        .first();

      if (!existingConfig) {
        await knex(configTableName).insert({
          bot_id: bot.uuid_unique,
          company_id: bot.company_id,
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
exports.down = async function (knex) {
  const [extension] = await knex("extensions").where({
    key: "GLORIA_FOOD",
  });

  await knex(tableName).where("extension", extension.uuid_unique).del();
  await knex(configTableName).where("extension", extension.uuid_unique).del();
};
