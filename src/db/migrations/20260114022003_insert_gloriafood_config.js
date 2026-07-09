const tableName = 'configs_templates';
const configKey = 'GLORIA_FOOD_ITBMS_ENABLED';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const config = {
    key: configKey,
    name: "Paya¡ ITBMS Enabled",
    data_default: "false",
    data_type: "boolean",
    description: "Enable ITBMS charging for Paya¡ orders.",
    owner_type: "extension",
    internal: false,
  };

  const [extension] = await knex("extensions")
    .where({ key: "GLORIA_FOOD" })
    .select("uuid_unique");

  if (!extension) {
    throw new Error("Extension GloriaFood not found");
  }

  await knex(tableName).insert({
    ...config,
    extension_id: extension.uuid_unique,
  });

  const [insertedConfig] = await knex(tableName).where({
    key: configKey,
    extension_id: extension.uuid_unique,
  });

  const gloriaFoodKey = "GLORIA_FOOD_STATUS";
  const [gloriaFoodConfig] = await knex(tableName)
    .where({
      key: gloriaFoodKey,
    })
    .select("uuid_unique");

  if (!gloriaFoodConfig) {
    throw new Error("GloriaFood status config not found");
  }

  const botsWithGloriaFood = await knex("company_configs")
    .where({
      config_template_id: gloriaFoodConfig.uuid_unique,
    })
    .select("bot_id", "company_id");

  if (botsWithGloriaFood.length > 0) {
    const configsToInsert = botsWithGloriaFood.map(({ bot_id, company_id }) => ({
      bot_id,
      company_id: company_id,
      config_template_id: insertedConfig.uuid_unique,
      data: insertedConfig.data_default,
    }));

    if (configsToInsert.length === 0) {
      return;
    }

    await knex("company_configs").insert(configsToInsert);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const config = await knex(tableName).where({ key: configKey }).first();

  if (!config) return;

  await knex("company_configs")
    .where({ config_template_id: config.uuid_unique })
    .del();

  await knex(tableName)
    .where({ uuid_unique: config.uuid_unique })
    .del();
};
