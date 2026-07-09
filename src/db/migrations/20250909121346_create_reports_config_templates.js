const allTimezones = Intl.supportedValuesOf("timeZone");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const configs_templates = [
    {
      key: "WEEKLY_REPORT_ENABLED",
      name: "Weekly Report Enabled",
      data_default: false,
      data_type: "boolean",
      description: "Enable weekly reports for the bot.",
      internal: false,
    },
    {
      key: "WEEKLY_REPORT_CRON",
      name: "Weekly Report Cron",
      data_default: "0 9 * * 1",
      data_type: "cron",
      description: "The cron expression for the weekly report schedule.",
      internal: false,
    },
    {
      key: "WEEKLY_REPORT_WHATSAPP_GROUP",
      name: "Weekly Report Whatsapp Group",
      data_default: "",
      data_type: "string",
      description:
        "The WhatsApp group name where the weekly reports will be sent.",
      internal: false,
    },
    {
      key: "BOT_TIMEZONE",
      data_default: "America/Panama",
      description:
        "Defines the timezone in which the bot operates. This affects scheduling, timestamps, and time-based logic.",
      name: "Bot Timezone",
      data_type: "enum",
      data_options: JSON.stringify(
        allTimezones.map((timezone) => {
          const date = new Date();
          const options = {
            timeZone: timezone,
            timeZoneName: "longOffset",
          };

          const formatter = new Intl.DateTimeFormat("en", options);
          const offsetPart = formatter
            .formatToParts(date)
            .find((part) => part.type === "timeZoneName");
          const offset = offsetPart ? offsetPart.value : "";

          const label = `${timezone
            .replace(/_/g, " ")
            .replace(/\//g, " / ")} (${offset})`;

          return { label, value: timezone };
        })
      ),
    },
  ];

  for (const config of configs_templates) {
    await knex("configs_templates").insert({
      owner_type: "bot",
      key: config.key,
      name: config.name,
      data_default: config.data_default,
      data_type: config.data_type,
      data_options: config.data_options || null,
      extension_id: null,
      description: config.description,
      internal: config.internal || false,
    });
  }

  const bots = await knex("bots");
  const keys = configs_templates.map((c) => c.key);

  const templates = await knex("configs_templates")
    .where("owner_type", "bot")
    .whereIn("key", keys);

  for (const bot of bots) {
    for (const config of templates) {
      await knex("company_configs").insert({
        company_id: bot.company_id,
        bot_id: bot.uuid_unique,
        config_template_id: config.uuid_unique,
        data: config.data_default,
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const keys = [
    "WEEKLY_REPORT_ENABLED",
    "WEEKLY_REPORT_CRON",
    "WEEKLY_REPORT_WHATSAPP_GROUP",
    "BOT_TIMEZONE",
  ];

  const templates = await knex("configs_templates")
    .where("owner_type", "bot")
    .whereIn("key", keys);

  for (const template of templates) {
    await knex("company_configs")
      .where("config_template_id", template.uuid_unique)
      .del();
  }

  await knex("configs_templates")
    .where("owner_type", "bot")
    .whereIn("key", keys)
    .del();
};
