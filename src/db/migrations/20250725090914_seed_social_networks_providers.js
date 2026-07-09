/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const whatsappNetwork = await knex("social_networks")
    .where("key", "WHATSAPP")
    .first();

  if (!whatsappNetwork) {
    throw new Error(
      "WHATSAPP social network not found. Run the social_networks migrations and seeders first."
    );
  }

  await knex("social_networks_providers")
    .where("social_network_id", whatsappNetwork.uuid_unique)
    .whereIn("key", ["web-whatsapp", "meta"])
    .del();

  const providers = [
    {
      key: "web-whatsapp",
      name: "Web WhatsApp",
      description: JSON.stringify([
        {
          en: "Connect your bot to WhatsApp via WhatsApp Web. Supports messages, media, and group management.",
          es: "Connect your bot to WhatsApp through WhatsApp Web. Supports messages, media, and group management.",
          zh: "通过 WhatsApp Web 将您的机器人连接到 WhatsApp。支持消息、媒体和群组管理。",
        },
      ]),
      social_network_id: whatsappNetwork.uuid_unique,
      is_default: true,
      status: true,
    },
    {
      key: "meta",
      name: "Meta WhatsApp Business API",
      description: JSON.stringify([
        {
          en: "Connect your bot using the official Meta WhatsApp Business API. Supports messaging, media, templates, and webhooks.",
          es: "Connect your bot to WhatsApp through WhatsApp Web. Supports messages, media, and group management.",
          zh: "使用 Meta 官方的 WhatsApp Business API 连接您的机器人。支持消息、媒体、模板和 Webhook。",
        },
      ]),
      social_network_id: whatsappNetwork.uuid_unique,
      is_default: false,
      status: true,
    },
  ];

  await knex("social_networks_providers").insert(providers);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const whatsappNetwork = await knex("social_networks")
    .where("key", "WHATSAPP")
    .first();

  if (whatsappNetwork) {
    await knex("social_networks_providers")
      .where("social_network_id", whatsappNetwork.uuid_unique)
      .whereIn("key", ["web-whatsapp", "meta"])
      .del();
  }
};
