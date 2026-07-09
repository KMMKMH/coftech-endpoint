const tableName = "extensions";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName)
    .update({
      key: "WHATSAPP_SETTINGS",
      name: "Whatsapp Settings",
      icon: "FaWhatsapp",
    })
    .where({ key: "WHATSAPP_CALL_CONTROL" });

  const [extension] = await knex(tableName).where({ key: "WHATSAPP_SETTINGS" });

  await knex("configs_templates").insert({
    owner_type: "extension",
    key: "WHATSAPP_RESPONSE_UNREAD_STATUS",
    data_default: false,
    data_type: "boolean",
    description: "Bot response unread messages when is initialized",
    extension_id: extension.uuid_unique,
  });

  await knex("configs_templates").insert({
    owner_type: "extension",
    key: "WHATSAPP_UNREAD_HOURS",
    data_default: 24,
    data_type: "integer",
    description: "Max number of hours to response unread messages",
    extension_id: extension.uuid_unique,
  });

  const bots = await knex("bots");
  const [templateStatus] = await knex("configs_templates").where({
    key: "WHATSAPP_RESPONSE_UNREAD_STATUS",
  });
  const [template] = await knex("configs_templates").where({
    key: "WHATSAPP_UNREAD_HOURS",
  });

  const extensionConfigTemplates = await knex("configs_templates").where({
    extension_id: extension.uuid_unique,
  });

  for (const bot of bots) {
    const [hasExtension] = await knex("bots_extensions").where({
      bot_id: bot.uuid_unique,
      extension: extension.uuid_unique,
    });

    if (hasExtension) {
      await knex("company_configs").insert({
        company_id: bot.company_id,
        bot_id: bot.uuid_unique,
        config_template_id: templateStatus.uuid_unique,
        data: templateStatus.data_default,
      });

      await knex("company_configs").insert({
        company_id: bot.company_id,
        bot_id: bot.uuid_unique,
        config_template_id: template.uuid_unique,
        data: template.data_default,
      });
    } else {
      await knex("bots_extensions").insert({
        bot_id: bot.uuid_unique,
        extension: extension.uuid_unique,
      });

      for (const t of extensionConfigTemplates) {
        const [existTemplate] = await knex("company_configs").where({
          company_id: bot.company_id,
          bot_id: bot.uuid_unique,
          config_template_id: t.uuid_unique,
        });

        if (existTemplate) {
          continue;
        }

        await knex("company_configs").insert({
          company_id: bot.company_id,
          bot_id: bot.uuid_unique,
          config_template_id: t.uuid_unique,
          data: t.data_default,
        });
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const [templateStatus] = await knex("configs_templates").where({
    key: "WHATSAPP_RESPONSE_UNREAD_STATUS",
  });

  const [template] = await knex("configs_templates").where({
    key: "WHATSAPP_UNREAD_HOURS",
  });

  await knex("company_configs")
    .where({ config_template_id: templateStatus.uuid_unique })
    .del();
  await knex("company_configs")
    .where({ config_template_id: template.uuid_unique })
    .del();

  await knex("configs_templates")
    .where({ uuid_unique: templateStatus.uuid_unique })
    .del();
  await knex("configs_templates")
    .where({ uuid_unique: template.uuid_unique })
    .del();

  await knex(tableName)
    .update({
      key: "WHATSAPP_CALL_CONTROL",
      name: "WhatsApp Call Control",
      icon: "FaPhone",
    })
    .where({ key: "WHATSAPP_SETTINGS" });
};
