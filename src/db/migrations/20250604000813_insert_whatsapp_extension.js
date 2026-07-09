const { v4 } = require("uuid");
const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const [category] = await knex("extensions_categories").where({
    name: "BOT_UTILITIES",
  });

  await knex.schema.alterTable(tableName, (table) => {
    table.boolean("internal").defaultTo(false).notNullable();
  });

  await knex(tableName).insert({
    key: "WHATSAPP_PROVIDER",
    name: "Whatsapp Provider",
    description: JSON.stringify({
      en: "Lets you choose between different WhatsApp providers to quickly and flexibly access the messaging service based on your preference.",
      es: "Lets you choose between different WhatsApp providers to quickly and flexibly access the messaging service based on your preference.",
      zh: "让您根据自己的偏好，在不同WhatsApp服务提供商之间灵活切换，快速访问消息服务。",
    }),
    icon: "FaWhatsapp",
    category_id: category.uuid_unique,
    internal: true,
  });

  const [extension] = await knex(tableName).where({
    key: "WHATSAPP_PROVIDER",
  });

  const configs_templates = [
    {
      key: "WHATSAPP_PROVIDER",
      data_default: "web-whatsapp",
      data_type: "enum",
      description: "Select the WhatsApp provider you want to use for your bot.",
      data_options: JSON.stringify([
        {
          label: "Web Whatsapp",
          value: "web-whatsapp",
          description: {
            es: "This is the default option and allows you to connect via WhatsApp Web in a practical and efficient way. The integration is immediate and does not require additional technical setup, making it easy to send and receive messages. For optimal performance, we recommend moderate use and following WhatsApp best practices.\n\nYou do not need any additional setup; just scan the QR code.",
            en: "This is the default option and allows you to connect via WhatsApp Web in a practical and efficient way. The integration is immediate and does not require additional technical setup, making it easy to send and receive messages. For optimal performance, we recommend moderate use and following WhatsApp's best practices.\n\nYou don't need any additional setup—just scan the QR code.",
            zh: "这是默认选项，可让您通过 WhatsApp Web 以实用高效的方式进行连接。集成是即时的，不需要额外的技术配置，方便发送和接收消息。为了保持最佳性能，我们建议适度使用并遵循 WhatsApp 的最佳实践。\n\n您无需进行任何额外设置，只需扫描二维码即可。",
          },
        },
        {
          label: "Meta Whatsapp",
          value: "meta",
          description: {
            es: "This option allows you to connect through Meta official WhatsApp Business API. It is ideal for businesses that need a more robust and scalable integration. Initial technical setup is required, including creating a WhatsApp Business account and obtaining an access token. This option is suitable for intensive use and offers more features.",
            en: "This option allows you to connect through Meta's official WhatsApp Business API. It's ideal for businesses that need more robust and scalable integration. Initial technical setup is required, including creating a WhatsApp Business account and obtaining an access token. This option is suitable for intensive use and offers more advanced features.",
            zh: "此选项允许您通过 Meta 的官方 WhatsApp Business API 进行连接。非常适合需要更强大、可扩展集成的企业。需要初始技术设置，包括创建 WhatsApp Business 账户和获取访问令牌。此选项适合高强度使用，并提供更多高级功能。",
          },
        },
      ]),
    },
    {
      key: "WHATSAPP_BUSINESS_ID",
      data_default: "",
      data_type: "string",
      description:
        "The WhatsApp Business ID is a unique identifier for your WhatsApp Business account. It is required for the Meta WhatsApp provider.",
    },
    {
      key: "WHATSAPP_SYSTEM_ACCESS_TOKEN",
      data_default: "",
      data_type: "string",
      description:
        "The WhatsApp system access token is a unique identifier for your WhatsApp Business account. It is required for the Meta WhatsApp provider.",
    },
    {
      key: "WHATSAPP_PHONE_NUMBER_ID",
      data_default: "",
      data_type: "string",
      description:
        "The WhatsApp phone number ID is a unique identifier for your WhatsApp Business account. It is required for the Meta WhatsApp provider.",
    },
    {
      key: "WHATSAPP_WEBHOOK_SECRET",
      data_default: "",
      data_type: "string",
      description:
        "The WhatsApp webhook secret. It is required for the Meta WhatsApp provider.",
      internal: true,
    },
  ];

  for (const config of configs_templates) {
    await knex("configs_templates").insert({
      owner_type: "extension",
      key: config.key,
      data_default: config.data_default,
      data_type: config.data_type,
      data_options: config.data_options || null,
      extension_id: extension.uuid_unique,
      description: config.description,
      internal: config.internal || false,
    });
  }

  const bots = await knex("bots");
  const templates = await knex("configs_templates").where({
    extension_id: extension.uuid_unique,
  });

  for (const bot of bots) {
    const existTable = await knex.schema.hasTable("bots_extensions");
    if (existTable) {
      await knex("bots_extensions").insert({
        bot_id: bot.uuid_unique,
        extension: extension.uuid_unique,
      });
    }
    for (const config of templates) {
      await knex("company_configs").insert({
        company_id: bot.company_id,
        bot_id: bot.uuid_unique,
        config_template_id: config.uuid_unique,
        data:
          config.key === "WHATSAPP_WEBHOOK_SECRET" ? v4() : config.data_default,
      });
    }
    return;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const extension = await knex(tableName)
    .where({
      key: "WHATSAPP_PROVIDER",
    })
    .first();

  const configs_templates = await knex("configs_templates").where({
    extension_id: extension.uuid_unique,
  });

  for (const template of configs_templates) {
    await knex("company_configs")
      .where({
        config_template_id: template.uuid_unique,
      })
      .del();
  }

  await knex("configs_templates")
    .where({
      extension_id: extension.uuid_unique,
    })
    .del();

  await knex("bots_extensions")
    .where({
      extension: extension.uuid_unique,
    })
    .del();

  await knex(tableName)
    .where({
      uuid_unique: extension.uuid_unique,
    })
    .del();

  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn("internal");
  });
};
