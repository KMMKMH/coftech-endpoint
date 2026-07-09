const tableName = "company_configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const openAIExtension = await knex("extensions")
    .where({ key: "OPEN_AI_SERVICE" })
    .first();

  const humanizeExtension = await knex("extensions")
    .where({ key: "HUMANIZE_RESPONSE" })
    .first();

  await knex(tableName)
    .where({ key: "OPENAI_KEY" })
    .update({ extension: openAIExtension.uuid_unique });

  await knex(tableName)
    .where({ key: "GPT_MODEL" })
    .update({ extension: openAIExtension.uuid_unique });

  await knex(tableName)
    .where({ key: "HUMANIZE_RESPONSE" })
    .update({ extension: humanizeExtension.uuid_unique });

  const botField = await knex("bots").first();
  await knex("bots_extensions").insert({
    bot_id: botField.uuid_unique,
    extension: openAIExtension.uuid_unique,
  });
  await knex("bots_extensions").insert({
    bot_id: botField.uuid_unique,
    extension: humanizeExtension.uuid_unique,
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function () {};
