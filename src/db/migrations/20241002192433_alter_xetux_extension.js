const newXetuxConfigs = [];
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const extension = await knex("extensions").where({ key: "XETUX" }).first();

  const botsWithXetux = await knex("bots_extensions").where({ extension: extension.uuid_unique });
  const oldXetuxConfigs = await knex("company_configs").where({ extension: extension.uuid_unique });

  for (const config of oldXetuxConfigs) {
    if (config.key != "XETUX_STATUS" && config.key != "XETUX_URL") {
      await knex("company_configs").where({ uuid_unique: config.uuid_unique }).del();
    }
  }

  for (const bot of botsWithXetux) {
    for (const config of newXetuxConfigs) {
      if (config.key != "XETUX_STATUS" && config.key != "XETUX_URL") {
        const botData = await knex("bots").where({ uuid_unique: bot.bot_id }).first();

        await knex("company_configs").insert({
          company_id: botData.company_id,
          bot_id: bot.bot_id,
          extension: extension.uuid_unique,
          ...config,
        });
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const oldConfigs = [
    { key: "XETUX_STATUS_SALES_DAILY", data: "", description: "generate sales report", data_type: "boolean" },
    { key: "XETUX_CRON_SALES_DAILY", data: "", description: "sales report cron", data_type: "time" },
    { key: "XETUX_STATUS_SALES_SUMMARY", data: "", description: "generate sales report", data_type: "boolean" },
    { key: "XETUX_CRON_SALES_SUMMARY", data: "", description: "sales report cron", data_type: "cron" },
    { key: "XETUX_STATUS_SALES_COMPARE_MONTHLY", data: "", description: "generate sales report comparing two dates", data_type: "boolean" },
    { key: "XETUX_CRON_SALES_COMPARE_MONTHLY", data: "", description: "sales comparison report cron", data_type: "cron" },
    { key: "XETUX_STATUS_BUY_DAILY", data: "", description: "generate purchase report", data_type: "boolean" },
    { key: "XETUX_CRON_BUY_DAILY", data: "", description: "purchase report cron", data_type: "time" },
    { key: "XETUX_STATUS_BUY_SUMMARY", data: "", description: "generate purchase report", data_type: "boolean" },
    { key: "XETUX_CRON_BUY_SUMMARY", data: "", description: "purchase report cron", data_type: "cron" },
    { key: "XETUX_STATUS_BUY_COMPARE_MONTHLY", data: "", description: "generate purchase report comparing two dates", data_type: "boolean" },
    { key: "XETUX_CRON_BUY_COMPARE_MONTHLY", data: "", description: "purchase comparison report cron", data_type: "cron" },
    { key: "XETUX_STATUS_PAYMENT_METHOD_DAILY", data: "", description: "generate payment method report", data_type: "boolean" },
    { key: "XETUX_CRON_PAYMENT_METHOD_DAILY", data: "", description: "payment method report cron", data_type: "time" },
    { key: "XETUX_STATUS_PAYMENT_METHOD_SUMMARY", data: "", description: "generate payment method report", data_type: "boolean" },
    { key: "XETUX_CRON_PAYMENT_METHOD_SUMMARY", data: "", description: "payment method report cron", data_type: "cron" },
    { key: "XETUX_STATUS_PAYMENTS_COMPARE_MONTHLY", data: "", description: "generate payment method report comparing two dates", data_type: "boolean" },
    { key: "XETUX_CRON_PAYMENTS_COMPARE_MONTHLY", data: "", description: "payment method comparison report cron", data_type: "cron" }
  ];

  const extension = await knex("extensions").where({ key: "XETUX" }).first();
  const botsWithXetux = await knex("bots_extensions").where({ extension: extension.uuid_unique });

  for (const bot of botsWithXetux) {
    for (const config of oldConfigs) {
      const botData = await knex("bots").where({ uuid_unique: bot.bot_id }).first();

      await knex("company_configs").insert({
        company_id: botData.company_id,
        bot_id: bot.bot_id,
        extension: extension.uuid_unique,
        ...config,
      });
    }
  }
};
