const tableName = "extensions";
const extensionKey = "CAMPAIGNS";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex(tableName).insert({
    key: extensionKey,
    name: "Campaigns",
    icon: "FaClock",
    description: JSON.stringify({
      english: "Enables the bot to send bulk campaign messages.",
      spanish: "Habilita el bot para enviar mensajes de campaña por lotes.",
    }),
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const extension = await knex(tableName).where({ key: extensionKey }).first();

  await knex("bots_extensions").where({ extension: extension.uuid_unique }).del();
  await knex("company_configs").where({ extension: extension.uuid_unique }).del();
  await knex(tableName).where({ uuid_unique: extension.uuid_unique }).del();
};
