/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const extension = await knex("extensions").where({ key: "BOT_HUMAN_RESPONSE" }).first();

  await knex("bots_extensions").where({ extension: extension.uuid_unique }).del();
  await knex("company_configs").where({ extension: extension.uuid_unique }).del();

  const companies = await knex("company");

  for (const company of companies) {
    await knex("company_configs").insert({
      company_id: company.uuid_unique,
      key: "BOT_HUMAN_TIMEOUT",
      data: 30,
      description: "MINUTES TO REACTIVATE BOT",
      data_type: "integer",
    });

    await knex("company_configs").insert({
      company_id: company.uuid_unique,
      key: "BOT_HUMAN_TIMEOUT_GROUPS",
      data: "true",
      description: "BOT CAN REACTIVATE IN GROUPS",
      data_type: "boolean",
    });
  }

  await knex("extensions").where({ uuid_unique: extension.uuid_unique }).del();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex("company_configs").where({ key: "BOT_HUMAN_TIMEOUT" }).del();
  await knex("company_configs").where({ key: "BOT_HUMAN_TIMEOUT_GROUPS" }).del();

  await knex("extensions").insert({
    key: "BOT_HUMAN_RESPONSE",
    name: "Bot Human Response",
    icon: "FaUserShield",
  });

  const [extension] = await knex("extensions").where({
    key: "BOT_HUMAN_RESPONSE",
  });

  const bots = await knex("bots").select("uuid_unique", "company_id");

  for (const bot of bots) {
    await knex("bots_extensions").insert({
      bot_id: bot.uuid_unique,
      extension: extension.uuid_unique,
    });

    await knex("company_configs").insert({
      bot_id: bot.uuid_unique,
      company_id: bot.company_id,
      extension: extension.uuid_unique,
      key: "BOT_HUMAN_TIMEOUT",
      data: 30,
      description: "MINUTES TO REACTIVATE BOT",
      data_type: "integer",
    });

    await knex("company_configs").insert({
      bot_id: bot.uuid_unique,
      company_id: bot.company_id,
      extension: extension.uuid_unique,
      key: "BOT_HUMAN_TIMEOUT_GROUPS",
      data: true,
      description: "BOT CAN REACTIVATE IN GROUPS",
      data_type: "boolean",
    });
  }
};
