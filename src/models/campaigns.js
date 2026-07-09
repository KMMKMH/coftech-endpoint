const dayjs = require("dayjs");
const repoBots = require("../repositories/bots");
const repoCompany = require("../repositories/company");
const repoExtensions = require("../repositories/extensions");
const repoCampaigns = require("../repositories/campaigns");
const repoAWS = require("../repositories/aws");

const modelBots = require("./bots");
const modelDesk = require("../models/desk");

const { SOURCES, SOURCE_CONFIGS } = require("../utils/campaignsSourceConfigs");
const { sendDataToInstance } = require("../utils/sendDataToInstance");
const replaceVariablesInText = require("../utils/replaceVariablesInText");
const { BOT_EVENTS } = require("../utils/events");
const logger = require("../utils/logger");
const createBotQueue = require("../utils/rabbit/createBotQueue");

const tablePhoneColumnRegex = /^\d+$/;

const getCampaigns = async (query) => {
  try {
    const { companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company: ${companyID} not found.`);
    }

    return await repoCampaigns.getCampaignsByField({
      "campaigns.company_id": companyID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const createCampaign = async (query, body) => {
  try {
    const { botID } = query;
    const { name, type, cron, source, message, media } = body;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const { company_id: companyID } = botField;

    const [campaignsExtensionField] = await repoExtensions.getExtensionByField({
      "extensions.key": "CAMPAIGNS",
    });
    if (!campaignsExtensionField) {
      throw new Error(`Extension: CAMPAIGNS not found.`);
    }

    const { uuid_unique: extensionID } = campaignsExtensionField;

    const [existBotExtension] = await repoBots.getBotsExtensionsByField({
      "vbe.bot_id": botID,
      "vbe.extension_id": extensionID,
    });
    if (!existBotExtension) {
      throw new Error(`Campaigns extension not found for Bot ${botID}.`);
    }

    if (!SOURCES.includes(source)) {
      throw new Error(`Source: ${source} not found.`);
    }

    const Types = ["UNIQUE", "RECURRENT"];
    if (!Types.includes(type)) {
      throw new Error(`Type: ${type} not found.`);
    }

    const data = {
      company_id: companyID,
      bot_id: botID,
      name,
      type,
      cron,
      source,
      message,
      media,
      source_configs: JSON.stringify(SOURCE_CONFIGS[source]),
    };

    return await repoCampaigns.saveCampaign(data);
  } catch (error) {
    throw new Error(error);
  }
};

const updateCampaign = async (query, body) => {
  try {
    const { campaignID } = query;
    const { type, source } = body;

    const [campaignField] = await repoCampaigns.getCampaignsByField({
      "campaigns.uuid_unique": campaignID,
    });
    if (!campaignField) {
      throw new Error(`Campaign: ${campaignID} not found.`);
    }

    const fieldsToUpdate = ["name", "cron", "message", "media"];
    let dataToUpdate = {};

    if (type && type !== campaignField.type && type !== "") {
      const Types = ["UNIQUE", "RECURRENT"];
      if (!Types.includes(type)) {
        throw new Error(`Type ${type} is not valid.`);
      }

      dataToUpdate["type"] = type;
    }

    if (source && source !== campaignField.source && source !== "") {
      if (!SOURCES.includes(source) || !SOURCE_CONFIGS[source]) {
        throw new Error(`Source ${source} not found.`);
      }

      dataToUpdate["source"] = source;
      dataToUpdate["source_configs"] = JSON.stringify(SOURCE_CONFIGS[source]);
    }

    fieldsToUpdate.forEach((field) => {
      if (
        body[field] != undefined &&
        body[field] != campaignField[field] &&
        body[field] != ""
      ) {
        dataToUpdate[field] = body[field];
      }
    });

    if (Object.keys(dataToUpdate).length > 0) {
      return await repoCampaigns.updateCampaign(
        { "campaigns.uuid_unique": campaignID },
        dataToUpdate
      );
    }

    return 0;
  } catch (error) {
    throw new Error(error);
  }
};

const updateCampaignConfigs = async (query, body) => {
  try {
    const { campaignID } = query;
    const { configs } = body;

    const [campaignField] = await repoCampaigns.getCampaignsByField({
      "campaigns.uuid_unique": campaignID,
    });
    if (!campaignField) {
      throw new Error(`Campaign: ${campaignID} not found.`);
    }

    const { source } = campaignField;
    const validKeys = SOURCE_CONFIGS[source].map((config) => config.key);

    const currentConfigs = campaignField.source_configs;

    const updatedConfigs = currentConfigs.map((config) => {
      const newConfig = configs.find((item) => item.key === config.key);

      if (newConfig && validKeys.includes(newConfig.key)) {
        return { ...config, data: newConfig.data };
      }

      return config;
    });

    return await repoCampaigns.updateCampaign(
      { "campaigns.uuid_unique": campaignID },
      { source_configs: JSON.stringify(updatedConfigs) }
    );
  } catch (error) {
    throw new Error(error);
  }
};

const startBotCampaign = async (query) => {
  try {
    const { campaignID } = query;

    const [campaignField] = await repoCampaigns.getCampaignsByField({
      "campaigns.uuid_unique": campaignID,
    });

    if (!campaignField) {
      throw new Error(`Campaign: ${campaignID} not found.`);
    }

    const { bot_id: botID, company_id: companyID } = campaignField;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const [extensionField] = await repoExtensions.getExtensionByField({
      "extensions.key": "CAMPAIGNS",
    });
    if (!extensionField) {
      throw new Error(`Extension: CAMPAIGNS not found.`);
    }

    const [existBotExtension] = await repoBots.getBotsExtensionsByField({
      "vbe.bot_id": botID,
      "vbe.extension_id": extensionField.uuid_unique,
    });
    if (!existBotExtension) {
      await repoCampaigns.updateCampaign(
        { "campaigns.uuid_unique": campaignID },
        { status: "CANCELLED" }
      );

      throw new Error(`Campaigns extension not found for Bot ${botID}.`);
    }

    const [campaignsStatusField] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.key": "CAMPAIGNS_STATUS",
    });
    if (!campaignsStatusField || campaignsStatusField.data != "true") {
      await repoCampaigns.updateCampaign(
        { "campaigns.uuid_unique": campaignID },
        { status: "CANCELLED" }
      );

      throw new Error(`Campaigns not enabled for Bot ${botID}.`);
    }

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${botID} does not have an instance.`);
    }

    const botQueue = createBotQueue(botID);
    await sendDataToInstance(botQueue, BOT_EVENTS.START_CAMPAIGN, {
      campaign_id: campaignID,
      campaign_name: campaignField.name,
      bot_id: botID,
      source: campaignField.source,
      status: campaignField.status,
    });

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const updateCampaignStatusOnInstance = async (query) => {
  try {
    const { campaignField, botID, status } = query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${botID} does not have an instance.`);
    }

    const botQueue = createBotQueue(botID);
    await sendDataToInstance(
      botQueue,
      BOT_EVENTS.UPDATE_CAMPAIGN_STATUS,
      {
        campaign_id: campaignField.uuid_unique,
        campaign_name: campaignField.name,
        bot_id: botID,
        status: status,
      }
    );

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const continueCampaign = async (query) => {
  try {
    const { campaignID } = query;

    const [campaignField] = await repoCampaigns.getCampaignsByField({
      "campaigns.uuid_unique": campaignID,
    });
    if (!campaignField) {
      throw new Error(`Campaign: ${campaignID} not found.`);
    }

    if (campaignField.status !== "STOPPED") {
      throw new Error(`Campaign: ${campaignID} is not stopped.`);
    }

    await repoCampaigns.updateCampaign(
      { "campaigns.uuid_unique": campaignID },
      { status: "IN_PROGRESS" }
    );

    await updateCampaignStatusOnInstance({
      campaignField,
      botID: campaignField.bot_id,
      status: "IN_PROGRESS",
    });

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const stopCampaign = async (query) => {
  try {
    const { campaignID } = query;

    const [campaignField] = await repoCampaigns.getCampaignsByField({
      "campaigns.uuid_unique": campaignID,
    });

    if (!campaignField) {
      throw new Error(`Campaign: ${campaignID} not found.`);
    }

    if (campaignField.status !== "IN_PROGRESS") {
      throw new Error(`Campaign: ${campaignID} is not in progress.`);
    }

    await repoCampaigns.updateCampaign(
      { "campaigns.uuid_unique": campaignID },
      { status: "STOPPED" }
    );

    await updateCampaignStatusOnInstance({
      campaignField,
      botID: campaignField.bot_id,
      status: "STOPPED",
    });

    return true;
  } catch (error) {
    console.log("error", error);
    throw new Error(error);
  }
};

const updateCampaignLogEndedAt = async (query) => {
  try {
    const { campaignLogID } = query;

    return await repoCampaigns.updateCampaignLog(
      {
        "campaigns_logs.uuid_unique": campaignLogID,
        "campaigns_logs.ended_at": null,
      },
      { ended_at: dayjs().format("YYYY-MM-DD HH:mm") }
    );
  } catch (error) {
    throw new Error(error);
  }
};

const validateConfigs = (configs, keys, campaignField) => {
  for (const key of keys) {
    if (!configs[key] || !configs[key].data.trim()) {
      cancellCampaign(campaignField);
      return false;
    }
  }

  return true;
};

const fetchData = async (source, configs, limit) => {
  /* eslint-disable */
  switch (source) {
    case "BOT": {
      const requiredKeys = [
        "BASE_ID",
        "TABLE_ID",
        "TABLE_PHONE_COLUMN",
        "TABLE_PHONE_COUNTRY_CODE",
      ];
      if (!validateConfigs(configs, requiredKeys)) {
        throw new Error(`Source config in ${configs} not found.`);
      }

      const data = await modelDesk.getDataTable({
        tableID: configs.TABLE_ID.data,
        limit,
      });
      return data || [];
    }
    default:
      throw new Error(`Source ${source} not found. Valid sources are: BOT.`);
  }
  /* eslint-enable */
};

const testCampaign = async (query) => {
  try {
    const { campaignID, phone } = query;

    const [campaignField] = await repoCampaigns.getCampaignsByField({
      "campaigns.uuid_unique": campaignID,
    });

    if (!campaignField) {
      throw new Error(`Campaign: ${campaignID} not found.`);
    }

    const { source_configs } = campaignField;

    const configs = source_configs.reduce((acc, item) => {
      acc[item.key] = item;
      return acc;
    }, {});

    const getRandomRecord = (dataList) => {
      if (!dataList || dataList.length === 0) {
        throw new Error(`Source table is empty.`);
      }
      return dataList[Math.floor(Math.random() * dataList.length)];
    };

    let limit = 25;

    const sourceData = await fetchData(campaignField.source, configs, limit);
    const randomRecord = getRandomRecord(sourceData);

    const message = replaceVariablesInText(campaignField.message, randomRecord);

    const { bot_id } = campaignField;
    await modelBots.sendMessageBot({ botID: bot_id }, { message, phone });

    return true;
  } catch (error) {
    throw new Error(
      `Failed to execute campaign for campaignID: ${query.campaignID}. Error: ${error.message}`
    );
  }
};

const cancellCampaign = async (campaignField) => {
  try {
    await Promise.all([
      repoCampaigns.updateCampaign(
        { "campaigns.uuid_unique": campaignField.uuid_unique },
        { status: "CANCELLED" }
      ),
      updateCampaignStatusOnInstance({
        campaignField,
        botID: campaignField.bot_id,
        status: "CANCELLED",
      }),
      repoCampaigns.updateCampaignLog(
        {
          "campaigns_logs.uuid_unique": campaignField.uuid_unique,
          "campaigns_logs.ended_at": null,
        },
        { ended_at: dayjs().format("YYYY-MM-DD HH:mm") }
      ),
    ]);

    throw new Error(
      `Campaign ${campaignField.name} has been canceled because required configurations are missing.`
    );
  } catch (err) {
    logger.error("Error while cancelling campaign:", err);
    throw err;
  }
};

const generatePhoneNumber = (countryCodeData, phoneColumnData, row) => {
  return tablePhoneColumnRegex.test(countryCodeData)
    ? `${countryCodeData}${row[phoneColumnData]}`
    : `${row[countryCodeData]}${row[phoneColumnData]}`;
};

const getBotCampaignData = async (campaignField, lastMessage) => {
  try {
    const { source_configs } = campaignField;

    const configs = source_configs.reduce((acc, item) => {
      acc[item.key] = item;
      return acc;
    }, {});

    const requiredKeys = [
      "BASE_ID",
      "TABLE_ID",
      "TABLE_PHONE_COLUMN",
      "TABLE_PHONE_COUNTRY_CODE",
    ];

    validateConfigs(configs, requiredKeys, campaignField);

    const { BASE_ID, TABLE_ID, TABLE_PHONE_COLUMN, TABLE_PHONE_COUNTRY_CODE } =
      configs;

    const lastMessageId = lastMessage ? lastMessage.source_register_id : -1;
    const where = `id > ${lastMessageId}`;

    const botData = await modelDesk.getDataTable({
      baseID: BASE_ID.data,
      tableID: TABLE_ID.data,
      limit: 1,
      where,
      isRaw: true,
    });

    if (!botData || botData.length === 0) {
      return {
        finish: true,
      };
    }

    const botRow = botData[0];

    const phoneNumber = generatePhoneNumber(
      TABLE_PHONE_COUNTRY_CODE.data,
      TABLE_PHONE_COLUMN.data,
      botRow
    );

    return {
      row: botRow,
      phone: phoneNumber,
      message: replaceVariablesInText(campaignField.message, botRow),
      register_id: botRow.id,
      finish: false,
    };
  } catch (e) {
    await modelBots.sendWhitelistMessagesBot(
      { botID: campaignField.bot_id },
      { message: e.message }
    );
    throw new Error(`Error in campaign data fetch: ${e.message}, error: ${e}`);
  }
};

module.exports = {
  getCampaigns,
  createCampaign,
  updateCampaign,
  updateCampaignConfigs,
  startBotCampaign,
  updateCampaignStatusOnInstance,
  continueCampaign,
  stopCampaign,
  updateCampaignLogEndedAt,
  testCampaign,
  getCampaignDataBySource: {
    bot: getBotCampaignData,
  },
};
