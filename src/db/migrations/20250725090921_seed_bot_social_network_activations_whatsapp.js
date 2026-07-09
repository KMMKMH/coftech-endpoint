/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const whatsappNetwork = await knex("social_networks")
    .where("key", "WHATSAPP")
    .first();

  if (!whatsappNetwork) {
    throw new Error("Red social WHATSAPP no encontrada.");
  }

  const defaultProvider = await knex("social_networks_providers")
    .where("key", "web-whatsapp")
    .andWhere("social_network_id", whatsappNetwork.uuid_unique)
    .first();

  if (!defaultProvider) {
    throw new Error("Provider web-whatsapp no encontrado.");
  }

  const botsWithWhatsapp = await knex("bots")
    .join("social_networks", "bots.network_id", "social_networks.uuid_unique")
    .where("social_networks.key", "WHATSAPP")
    .select("bots.uuid_unique as bot_id", "bots.network_id");

  for (const bot of botsWithWhatsapp) {
    const existingActivation = await knex("bot_social_network_activations")
      .where("bot_id", bot.bot_id)
      .andWhere("social_network_id", whatsappNetwork.uuid_unique)
      .first();

    if (!existingActivation) {
      await knex("bot_social_network_activations").insert({
        bot_id: bot.bot_id,
        social_network_id: whatsappNetwork.uuid_unique,
        sn_provider_id: defaultProvider.uuid_unique,
        store_log_id: null,
        is_active: true,
        activation_date: new Date(),
      });
    }
  }

  console.log("Activaciones de bots WhatsApp creadas exitosamente");
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const whatsappNetwork = await knex("social_networks")
    .where("key", "WHATSAPP")
    .first();

  if (!whatsappNetwork) {
    return;
  }

  const defaultProvider = await knex("social_networks_providers")
    .where("key", "web-whatsapp")
    .andWhere("social_network_id", whatsappNetwork.uuid_unique)
    .first();

  if (!defaultProvider) {
    return;
  }

  const deletedCount = await knex("bot_social_network_activations")
    .where("social_network_id", whatsappNetwork.uuid_unique)
    .andWhere("sn_provider_id", defaultProvider.uuid_unique)
    .del();

  console.log(`Revertidas ${deletedCount} activaciones de bots WhatsApp.`);
};
