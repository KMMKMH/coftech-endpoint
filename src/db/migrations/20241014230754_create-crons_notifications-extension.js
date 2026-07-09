const extensionName = "NOCO_CAMPAIGNS";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex("extensions").insert({
    key: extensionName,
    name: "Noco campaigns",
    icon: "FaClock",
    description: JSON.stringify({
      english: "Allows the bot to send messages using nocodb.",
      spanish: "Permite al bot enviar mensajes usando nocodb.",
    }),
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const [extension] = await knex("extensions").where({ key: extensionName });

  await knex("bots_extensions").where({ extension: extension.uuid_unique }).del();
  await knex("company_configs").where({ extension: extension.uuid_unique }).del();
  await knex("extensions").where({ key: extensionName }).del();
};
