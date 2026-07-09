const cronParser = require("cron-parser");
const logger = require("./logger");

const repoCompany = require("../repositories/company");
const repoUtils = require("../repositories/utils");
const repoBots = require("../repositories/bots");

const dateToCron = require("./dateToCron");
const { executeXetuxCron } = require("./crons/xetux/executeCronKey");
const {
  executeReminderBooking,
} = require("./crons/google/executeReminderBooking");

const CRON_FEATURE_VALIDATIONS = {
  "GOOGLE_CALENDAR_INTERNAL_CRON": "GOOGLE_CALENDAR_STATUS",
  "XETUX_CRON_": "XETUX_STATUS"
};

const main = async () => {
  const configsCron = (
    await repoCompany.getCompanyConfigByField({
      "configs_templates.data_type": "cron",
    })
  ).filter(
    (config) =>
      config.data !== "" &&
      config.bot_id !== null &&
      config.bot_id !== undefined &&
      config.bot_id !== "" &&
      config.template_extension_id !== null &&
      config.template_extension_id !== undefined &&
      config.template_extension_id !== ""
  );

  for (const item of configsCron) {
    const isEnabled = await isCronFeatureEnabled(item);
    if (!isEnabled) {
      continue;
    }

    const next = cronParser.parseExpression(item.data).next().toString();
    const prev = cronParser.parseExpression(item.data).prev().toString();

    const data = {
      cron: item.data,
      bot_id: item.bot_id,
      company_id: item.company_id,
      type: item.template_data_type,
      key: item.template_key,
      next: dateToCron(next),
      prev: dateToCron(prev),
    };

    const [cronQueueField] = await repoUtils.getCronQueueByField(data);

    if (!cronQueueField) {
      const cronResponse = await repoUtils.insertCronQueue(data);

      if (cronResponse) {
        await executeCronKey(cronResponse);
      }
    }
  }
};

const isCronFeatureEnabled = async (cronConfig) => {
  const { template_key: key, bot_id: botID, company_id: companyID } = cronConfig;

  const statusKey = Object.entries(CRON_FEATURE_VALIDATIONS)
    .find(([cronKey]) => key === cronKey || key.includes(cronKey))?.[1];

  if (!statusKey) {
    return true;
  }

  const [featureStatus] = await repoCompany.getCompanyConfigByField({
    "company_configs.company_id": companyID,
    "company_configs.bot_id": botID,
    "configs_templates.owner_type": "extension",
    "configs_templates.key": statusKey,
  });

  if (!featureStatus || featureStatus.data !== "true") {
    return false;
  }

  if (key.includes("GOOGLE_CALENDAR_")) {
    const [botRefreshToken] = await repoBots.getBotsRefreshTokenByField({
      "bots_refresh_tokens.bot_id": botID,
    });

    if (!botRefreshToken) {
      return false;
    }
  }

  return true;
};

const cronHandlers = {
  XETUX_: executeXetuxCron,
  GOOGLE_CALENDAR_: executeReminderBooking,
};

const executeCronKey = async (data) => {
  try {
    const matchingKey = Object.keys(cronHandlers).find((key) =>
      data.key.includes(key)
    );

    if (matchingKey) {
      await cronHandlers[matchingKey](data);
    }

    await repoUtils.updateCronQueueStatus({
      "cron_queue_table.uuid_unique": data.uuid_unique,
    });
  } catch (error) {
    logger.error(`Error executing cron key: ${error.message}`);
  }
};

module.exports = main;
