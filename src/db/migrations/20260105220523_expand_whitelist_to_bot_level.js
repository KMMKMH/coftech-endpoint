const tableName = "configs_templates";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const newTemplateWhitelist = {
    key: "RESPOND_ONLY_WHITELIST",
    description: "ALLOW RESPONSES ONLY TO WHITELISTED USERS",
    owner_type: "bot",
    data_default: "false",
    data_type: "boolean",
    data_options: null,
    name: "Respond Only Whitelist",
  };

  await knex(tableName).insert(newTemplateWhitelist);

  const insertedTemplate = await knex(tableName)
    .select("uuid_unique")
    .where(newTemplateWhitelist)
    .first();

  if (!insertedTemplate) {
    throw new Error(
      "Failed to insert new RESPOND_ONLY_WHITELIST config template for bot owner_type"
    );
  }

  const oldTemplateWhitelistId = await knex(tableName)
    .select("uuid_unique")
    .where({
      key: "RESPOND_ONLY_WHITELIST",
      owner_type: "company",
    })
    .first();

  if (!oldTemplateWhitelistId) {
    throw new Error(
      "Old RESPOND_ONLY_WHITELIST config template not found for company owner_type"
    );
  }

  const botsToConfigure = await knex("company_configs")
    .join("bots", "company_configs.company_id", "bots.company_id")
    .where(
      "company_configs.config_template_id",
      oldTemplateWhitelistId.uuid_unique
    )
    .select(
      "bots.uuid_unique as bot_id",
      "bots.company_id as company_id",
      "company_configs.data as data"
    );

  const botsToAdd = botsToConfigure.map((b) => ({
    config_template_id: insertedTemplate.uuid_unique,
    company_id: b.company_id,
    bot_id: b.bot_id,
    data: b.data,
  }));

  if (botsToAdd.length > 0) {
    await knex("company_configs").insert(botsToAdd);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const newTemplateWhitelistId = await knex(tableName)
    .select("uuid_unique")
    .where({
      key: "RESPOND_ONLY_WHITELIST",
      owner_type: "bot",
    })
    .first();

  if (!newTemplateWhitelistId) {
    return;
  }

  await knex("company_configs")
    .where({
      config_template_id: newTemplateWhitelistId.uuid_unique,
    })
    .del();

  await knex(tableName)
    .where({
      uuid_unique: newTemplateWhitelistId.uuid_unique,
    })
    .del();
};
