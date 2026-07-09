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

  const providers = [
    {
      key: "baileys",
      name: "Baileys",
      description: JSON.stringify([
        {
          en: "Connect your bot to WhatsApp using the Baileys provider. It uses the WhatsApp Web multi-device protocol and supports messages, media, contacts, and group management.",
          es: "Connect your bot to WhatsApp using the Baileys provider. Uses the WhatsApp Web multi-device protocol and supports messages, media files, contacts, and group management.",
          zh: "使用 Baileys 提供程序将您的机器人连接到 WhatsApp。它使用 WhatsApp Web 的多设备协议，并支持消息、媒体、联系人和群组管理。",
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
      .whereIn("key", ["baileys"])
      .del();
  }
};
