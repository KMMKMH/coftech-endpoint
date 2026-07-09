require("dotenv").config();

const dayjs = require("dayjs");
const OpenAI = require("openai");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const { v4: uuidv4 } = require("uuid");

const logger = require("../utils/logger");
const { sendMessageToChannel } = require("../utils/discordConnection");
const { sendDataToInstance } = require("../utils/sendDataToInstance");
const { filterExtension } = require("../utils/filterExtension");

const repoBots = require("../repositories/bots");
const repoCompany = require("../repositories/company");
const repoAWS = require("../repositories/aws");
const repoExtension = require("../repositories/extensions");
const repoAccounts = require("../repositories/accounts");
const { repoPrompts } = require("../repositories/prompts");
const { repoPlans, repoPlansExtensions } = require("../repositories/plans");
const repoNoco = require("../repositories/noco");
const { repoBlacklist } = require("../repositories/blacklist");
const { repoSystemPrompts } = require("../repositories/systemPrompts");
const modelPrompt = require("./prompts");
const modelNoco = require("./noco");
const { ApiError } = require('../utils/errors/ApiError');
const ErrorCodes = require('../constants/errorCodes');
const {
  socialNetworksRepository,
  socialNetworksProvidersRepository,
} = require("../repositories/social");

const createBotQueue = require("../utils/rabbit/createBotQueue");
const { getOrganizationCosts } = require("../utils/openaiUtils");
const {
  extensionsDefaultFuncs,
  extensionsDefaultKeys,
} = require("../utils/extensionsDefaultFunctions");
const {
  processExtensionInjections,
} = require("../utils/extensionConfigInjector");
const { createChatRoom } = require("../utils/socket/createRoomName");
const { getSocket } = require("../utils/socket/socket");
const { BOT_EVENTS, ORCHESTATOR_EVENTS } = require("../utils/events");
const qrCache = require("../utils/qr/qrCache");
const CustomError = require("../utils/CustomError");

const listBots = async (query) => {
  try {
    const { companyID, identifier, user } = query;

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    const { role_key, company_id: accountCompanyID } = accountField;

    const findParams = {
      ...(identifier && { "bots.identifier": identifier }),
      ...(companyID
        ? { "bots.company_id": companyID }
        : role_key !== "SUPERADMIN" && { "bots.company_id": accountCompanyID }),
    };

    if (Object.keys(findParams).length <= 0) {
      if (role_key !== "SUPERADMIN") {
        throw new Error("BOT List Access denied.");
      }
    }

    return await repoBots.getBotsByField(findParams);
  } catch (error) {
    throw new Error(error);
  }
};

const createBOT = async (params, data) => {
  try {
    const { companyID, networkID, planID } = params;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found`);
    }

    const [networkField] = await socialNetworksRepository.getByField({
      "social_networks.uuid_unique": networkID,
    });
    if (!networkField) {
      throw new Error(`Network ${networkID} not found`);
    }

    const [providerField] = await socialNetworksProvidersRepository.getByField({
      "social_networks_providers.social_network_id": networkID,
      "social_networks_providers.is_default": 1,
    });

    if (!providerField) {
      throw new Error(`This network does not have a default provider`);
    }

    const { uuid_unique } = providerField;

    let instanceField;
    const { instanceID, bot_type } = data;

    const [planField] = await repoPlans.getByField({
      "plans.uuid_unique": planID,
    });

    if (!planField) {
      throw new Error(`Plan with ID ${planID} not found.`);
    }

    if (instanceID) {
      [instanceField] = await repoAWS.getInstanceByField({
        "aws_instances.uuid_unique": instanceID,
      });
      if (!instanceField) {
        throw new Error(`Instance ${instanceID} not found`);
      }
    }

    const botName = `Coftech-BOT-${Date.now()}`;
    const [responseBOT] = await repoBots.saveBot({
      name: botName,
      status: true,
      company_id: companyID,
      plan_id: planID,
      types: bot_type ? bot_type : 0,
    });
    logger.info(`New bot created for company: ${companyField.name}`);

    await checkBotPrompt(responseBOT.uuid_unique);

    if (responseBOT.types == "0") {
      await savePlansBotsExtensionsConfigs(responseBOT.uuid_unique);
    }

    await repoBots.saveBotSocialNetworkActivation({
      bot_id: responseBOT.uuid_unique,
      social_network_id: networkID,
      sn_provider_id: uuid_unique,
      is_active: 1,
    });

    const webhookID =
      process.env.ENVIRONMENT == "development" ||
      process.env.ENVIRONMENT == "test"
        ? process.env.DISCORD_BOT_TEST
        : process.env.DISCORD_BOT_PROD;

    sendMessageToChannel(webhookID, {
      message: `New bot created: ${botName} for company: ${companyField.name}`,
    });

    const accountField = await repoAccounts.getAccountByField({
      "accounts.company_id": companyID,
      "roles.key": "ADMIN",
    });

    for (const account of accountField) {
      if (account.phone) {
        sendMessageAsBot(
          account.phone,
          `New bot created: ${botName} for company: ${companyField.name}`
        );
      }
    }

    let instance_id;
    if (instanceID) {
      instance_id = instanceField.uuid_unique;
    } else {
      const [instanceBalancerField] = await repoAWS.getInstancesBalancer();

      instance_id = instanceBalancerField.uuid_unique;
    }

    await repoAWS.saveBotInstance({
      "aws_instances_bots.instance_id": instance_id,
      "aws_instances_bots.bot_id": responseBOT.uuid_unique,
    });

    return responseBOT;
  } catch (e) {
    throw new Error(e);
  }
};

const updateBot = async (queryParams, bodyParams) => {
  try {
    const { companyID, botID } = queryParams;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const query = {
      "bots.uuid_unique": botID,
      "bots.company_id": companyID,
    };

    const [dataBot] = await repoBots.getBotsByField(query);

    const fieldsToUpdate = ["name", "description", "photo"];

    let dataUpdate = {};

    fieldsToUpdate.forEach((field) => {
      if (
        bodyParams[field] != undefined &&
        bodyParams[field] != dataBot[field]
      ) {
        dataUpdate[field] = bodyParams[field];
      }
    });

    if (Object.keys(dataUpdate).length > 0) {
      return await repoBots.updateBot(query, dataUpdate);
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const initializeBot = async (data, jwtData) => {
  try {
    const { botID } = data;
    const { user: accountID } = jwtData;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
      "bots.status": true,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const {
      suspended,
      provider_id: providerID,
      provider_is_required_configs: isRequired,
      company_id,
    } = botField;

    let { network_key, provider_key } = botField;

    network_key = network_key ? network_key.toLowerCase() : null;
    provider_key = provider_key ? provider_key.toLowerCase() : null;

    if (!network_key || !provider_key) {
      throw new Error(`Both network_key and provider_key are required.`);
    }

    if (!suspended) {
      throw new Error(
        `The bot is already active and cannot be initialized again.`
      );
    }

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });

    if (!instanceBotField) {
      throw new Error(`Bot with ID ${botID} does not have an instance.`);
    }

    const { instance_name: instanceID } = instanceBotField;

    if (isRequired) {
      const expectedConfigs = await repoCompany.getConfigsTemplatesByField({
        "configs_templates.sn_provider_id": providerID,
      });

      const botConfigs = await repoCompany.getCompanyConfigByField({
        "company_configs.bot_id": botID,
        "configs_templates.sn_provider_id": providerID,
      });

      const missingOrEmpty = expectedConfigs.filter(({ uuid_unique }) => {
        const conf = botConfigs.find(
          ({ config_template_id }) => config_template_id === uuid_unique
        );
        return !conf || !conf.data || conf.data.trim() === "";
      });

      if (missingOrEmpty.length > 0) {
        throw new Error(
          "Essential configurations are missing to start this social network provider."
        );
      }
    }

    await checkBotPrompt(botID);

    await repoBots.updateBot(
      {
        "bots.uuid_unique": botID,
      },
      {
        suspended: false,
      }
    );

    await sendDataToInstance(instanceID, ORCHESTATOR_EVENTS.INITIALIZE_BOT, {
      bot_id: botID,
      network_key,
      provider_key,
      company_id,
    });

    qrCache.attach(accountID, botID);

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

const cancelInitializationBot = async (data) => {
  try {
    const { botID } = data;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
      "bots.status": true,
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

    await repoBots.updateBot(
      {
        "bots.uuid_unique": botID,
      },
      {
        suspended: true,
      }
    );

    const { instance_name: instanceID } = instanceBotField;

    await sendDataToInstance(
      instanceID,
      ORCHESTATOR_EVENTS.CANCEL_INITIALIZATION_BOT,
      {
        bot_id: botID,
        bot_type: botField.types,
      }
    );

    qrCache.del(botID);

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const updateBotEvent = async (where, data) => {
  try {
    const { botID } = where;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const [dataBot] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    const fieldToUpdate = ["identifier"];

    let dataUpdate = {};

    fieldToUpdate.forEach((field) => {
      if (data[field] != undefined && data[field] != dataBot[field]) {
        dataUpdate[field] = data[field];
      }
    });

    if (Object.keys(dataUpdate).length > 0) {
      if (dataUpdate.identifier) {
        const [blacklistField] = await repoBlacklist.getByField({
          "blacklist.company_id": botField.company_id,
          "blacklist.phone": dataUpdate.identifier,
          "blacklist.type": "BOT",
        });
        if (!blacklistField) {
          await repoBlacklist.save({
            company_id: botField.company_id,
            bot_id: botID,
            phone: dataUpdate.identifier,
            type: "BOT",
          });
        }
      }

      return await repoBots.updateBot(
        { "bots.uuid_unique": botID },
        { ...dataUpdate, "bots.suspended": false }
      );
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const sendMessageBot = async (
  data,
  body,
  { isAdmin = false, useSocket = false } = {}
) => {
  try {
    const { botID, accountID } = data;
    const { phone } = body;
    let isAssigned = false;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const isGroup = phone && phone.includes('@g.us');

    if (phone && !isGroup) {
      const phoneNumber = parsePhoneNumberFromString(`+${phone}`);
      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error(
          "Invalid phone number format. Please provide a valid international phone number."
        );
      }
    }

    if (phone && !isAdmin) {
      const [chatAssignedField] = await repoBots.getAssignedChatByField({
        "assigned_chats.bot_id": botID,
        "assigned_chats.phone_number": phone,
      });

      if (chatAssignedField) {
        isAssigned = true;

        if (!accountID) {
          throw new Error(
            "Account ID is required when chat is assigned to an user."
          );
        }

        const [accountField] = await repoAccounts.getAccountByField({
          "accounts.uuid_unique": accountID,
        });
        if (!accountField) {
          throw new Error(`Account not found.`);
        }

        if (chatAssignedField.user_id !== accountID) {
          throw new Error(
            `The account provided is not the one assigned to the chat.`
          );
        }
      }
    }

    const botQueue = createBotQueue(botID);
    await sendDataToInstance(botQueue, BOT_EVENTS.SEND_MESSAGE, {
      bot_id: botID,
      body,
    });

    if (isAssigned && useSocket) {
      const socket = getSocket();
      const room = createChatRoom(accountID, phone);

      await socket.to(room).emit("message:sent", {
        success: true,
        status: "sending",
        phoneNumber: phone,
        timestamp: dayjs().valueOf(),
      });

      logger.info(`Room: ${room} Message Sent. Bot Id ${botID}`);
    }

    return true;
  } catch (error) {
    logger.error(
      `Error al emitir al socket. Error : ${JSON.stringify(error, null, 4)}`
    );
    throw new Error(error);
  }
};

const sendWhitelistMessagesBot = async (data, body) => {
  try {
    const { botID } = data;

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

    const { uuid_unique } = instanceBotField;

    const [instanceField] = await repoAWS.getInstanceByField({
      "aws_instances.uuid_unique": uuid_unique,
    });

    if (!instanceField) return;

    const botQueue = createBotQueue(botID);
    sendDataToInstance(botQueue, BOT_EVENTS.SEND_MESSAGE_TO_WHITELIST, {
      bot_id: botID,
      body,
    });

    return true;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const sendMessageAsBot = async (phone, message) => {
  try {
    const [configWPField] = await repoCompany.getCoreConfigsByField({
      "configs.key": "WP_BOT_CONTACT",
    });
    if (!configWPField) {
      return false;
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.identifier": configWPField.data,
    });
    if (!botField) {
      return false;
    }

    const phoneNumber = phone.replace(/\D/g, "");
    if (phone.lenght < 10) {
      return false;
    }

    const response = await sendMessageBot(
      { botID: botField.uuid_unique },
      { message, phone: phoneNumber },
      { isAdmin: true }
    );
    return response;
  } catch (e) {
    console.log(e);
  }
};

const getBotInfo = async (data) => {
  try {
    const { botID } = data;

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
    await sendDataToInstance(botQueue, BOT_EVENTS.GET_BOT_INFO, {
      bot_id: botID,
    });

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const stopBot = async (data) => {
  try {
    const { botID } = data;

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

    const { instance_name: instanceID } = instanceBotField;

    await sendDataToInstance(instanceID, ORCHESTATOR_EVENTS.STOP_BOT, {
      bot_id: botID,
    });

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const deleteBot = async (data) => {
  try {
    const { botID } = data;

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

    const { instance_name: instanceID } = instanceBotField;

    await sendDataToInstance(instanceID, ORCHESTATOR_EVENTS.DELETE_BOT, {
      bot_id: botID,
    });

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const restartBot = async (query) => {
  try {
    const { botID } = query;

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

    const { instance_name: instanceID } = instanceBotField;

    await checkBotPrompt(botID);

    await sendDataToInstance(instanceID, ORCHESTATOR_EVENTS.RESTART_BOT, {
      bot_id: botID,
    });

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const startBot = async (query) => {
  try {
    const { botID } = query;

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

    const { instance_name: instanceID } = instanceBotField;

    await checkBotPrompt(botID);

    await sendDataToInstance(instanceID, ORCHESTATOR_EVENTS.START_BOT, {
      bot_id: botID,
    });

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const listBotExtensions = async (query) => {
  try {
    const { botID, unassigned = false } = query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const { company_id: companyID } = botField;

    const assignedExtensions = await repoBots.getBotsExtensionsByField({
      "vbe.bot_id": botID,
    });

    if (!unassigned) {
      await processExtensionInjections(assignedExtensions, {
        botID,
        companyID,
      });

      return filterExtension(assignedExtensions);
    }

    const allExtensions = await repoExtension.getExtensionByField({
      "extensions.status": true,
    });

    const assignedIDsSet = new Set(
      assignedExtensions.map((ext) => ext.extension)
    );

    const unassignedExtensions = allExtensions.filter(
      (ext) => !assignedIDsSet.has(ext.uuid_unique)
    );

    return unassignedExtensions;
  } catch (error) {
    throw new Error(error);
  }
};

const savePlansBotsExtensionsConfigs = async (botID) => {
  try {
    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const missingPlansExtensionsConfigs =
      await repoCompany.getMissingPlansExtensionsConfigs(botID);

    if (!missingPlansExtensionsConfigs.length) {
      return;
    }

    const mappedMissingConfigs = missingPlansExtensionsConfigs.map((row) => ({
      "company_configs.bot_id": row.bot_id,
      "company_configs.company_id": row.company_id,
      "company_configs.data": row.data_default,
      "company_configs.config_template_id": row.config_template_id,
    }));

    const configsToAdd = mappedMissingConfigs.map((config) =>
      repoCompany.saveCompanyConfig(config)
    );

    await Promise.all(configsToAdd);
    logger.info("Missing plans/extensions configs added successfully.");
  } catch (error) {
    throw new Error(error);
  }
};

const saveBotExtension = async (query) => {
  try {
    const { botID, extensionID } = query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const [extensionField] = await repoExtension.getExtensionByField({
      "extensions.uuid_unique": extensionID,
    });

    if (!extensionField) {
      throw new Error(`Extension: ${extensionID} not found.`);
    }

    const newExtensionKey = extensionField.key;

    const [existBotExtension] = await repoBots.getBotsExtensionsByField({
      "vbe.bot_id": botID,
      "vbe.extension_id": extensionID,
    });
    if (existBotExtension) {
      throw new Error(
        `Extension ID ${extensionID} already exists for Bot ID ${botID}.`
      );
    }

    const [existingPlanExtension] = await repoPlansExtensions.getByField({
      "plans_extensions.extension_id": extensionID,
    });

    if (existingPlanExtension) {
      throw new Error(
        `Cannot assign extension ${extensionID} to bot ${botID} because it is already assigned to a plan.`
      );
    }

    const { company_id: companyID } = botField;

    const extensionConfigs = await repoCompany.getConfigsTemplatesByField({
      "configs_templates.owner_type": "extension",
      "configs_templates.extension_id": extensionID,
    });
    if (!extensionConfigs.length) {
      throw new Error(`Configs not found for extension ID : ${extensionID}`);
    }

    for (const config of extensionConfigs) {
      const { uuid_unique: configID, data_default, key, internal } = config;

      const value =
        internal && extensionsDefaultKeys.includes(key)
          ? extensionsDefaultFuncs[key]()
          : data_default;

      await repoCompany.saveCompanyConfig({
        "company_configs.bot_id": botID,
        "company_configs.company_id": companyID,
        "company_configs.config_template_id": configID,
        "company_configs.data": value,
      });
    }

    if (newExtensionKey === "NOCODB_SERVICE") {
      const accountsField = await repoAccounts.getAccountByField({
        "accounts.company_id": companyID,
        "roles.key": "ADMIN",
      });
      if (accountsField.length > 0) {
        for (const account of accountsField) {
          const { email, company_id } = account;
          const [existAccount] = await repoNoco.getAccountByField({
            "nc_users_v2.email": email,
          });
          if (existAccount) {
            await modelNoco.updateRol(
              { companyID: company_id, email },
              { role: "creator" }
            );
          }
        }
      }
    }

    const response = await repoBots.saveBotExtensionByField({
      "extra_bots_extensions.bot_id": botID,
      "extra_bots_extensions.extension_id": extensionID,
    });
    if (response) {
      const extensionFields = await repoCompany.getCompanyConfigByField({
        "company_configs.bot_id": botID,
        "company_configs.company_id": companyID,
        "configs_templates.extension_id": extensionID,
      });

      const extensionKeys = extensionFields.map((ext) => {
        return {
          template_key: ext.template_key,
          data: ext.data,
          extension_category_dynamic: ext.extension_category_dynamic,
          extension_category_name: ext.extension_category_name,
        };
      });

      const [instanceBotField] = await repoAWS.getInstanceBotsByField({
        "aws_instances_bots.bot_id": botID,
      });
      if (!instanceBotField) {
        throw new Error(`Bot with ID ${botID} does not have an instance.`);
      }

      const botQueue = createBotQueue(botID);
      await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_BOT_CONFIG, {
        bot_id: botID,
        configs: extensionKeys,
      });
    }
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateBotExtension = async (query, body) => {
  try {
    const { botID, extensionID } = query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const [extensionField] = await repoExtension.getExtensionByField({
      "extensions.uuid_unique": extensionID,
    });
    if (!extensionField) {
      throw new Error(`Extension: ${extensionID} not found.`);
    }

    const [existingPlanExtension] = await repoPlansExtensions.getByField({
      "plans_extensions.extension_id": extensionID,
    });

    if (existingPlanExtension) {
      throw new Error(
        `Cannot update Extension ID ${extensionID} because it is assigned to a plan.`
      );
    }

    const [dataBotExtension] = await repoBots.getBotsExtensionsByField({
      "vbe.bot_id": botID,
      "vbe.extension_id": extensionID,
    });
    if (!dataBotExtension) {
      throw new Error(
        `Extension ID ${extensionID} not found for Bot ID ${botID}.`
      );
    }

    const fieldToUpdate = ["status"];
    let dataUpdate = {};

    fieldToUpdate.forEach((field) => {
      if (body[field] != undefined && body[field] != dataBotExtension[field]) {
        dataUpdate[field] = body[field];
      }
    });

    if (Object.keys(dataUpdate).length > 0) {
      const { key } = extensionField;
      const [instanceBotField] = await repoAWS.getInstanceBotsByField({
        "aws_instances_bots.bot_id": botID,
      });
      if (!instanceBotField) {
        throw new Error(`Bot with ID ${botID} does not have an instance.`);
      }

      const botQueue = createBotQueue(botID);
      await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_BOT_CONFIG, {
        bot_id: botID,
        key: key,
        data: body.status ? body.status : "",
      });

      return await repoBots.updateBotExtension(
        {
          "extra_bots_extensions.bot_id": botID,
          "extra_bots_extensions.extension_id": extensionID,
        },
        dataUpdate
      );
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteBotExtension = async (query) => {
  try {
    const { botID, extensionID } = query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const [extensionField] = await repoExtension.getExtensionByField({
      "extensions.uuid_unique": extensionID,
    });
    if (!extensionField) {
      throw new Error(`Extension: ${extensionID} not found.`);
    }

    const [existExtraPlanExtension] = await repoPlansExtensions.getByField({
      "plans_extensions.extension_id": extensionID,
    });

    if (existExtraPlanExtension) {
      throw new Error(
        `Cannot delete Extension ID ${extensionID} because it is assigned to a plan.`
      );
    }

    const [existBotExtension] = await repoBots.getBotsExtensionsByField({
      "vbe.bot_id": botID,
      "vbe.extension_id": extensionID,
    });
    if (!existBotExtension) {
      throw new Error(
        `Extension ID ${extensionID} not found for Bot ID ${botID}.`
      );
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
      BOT_EVENTS.DELETE_BOT_EXTENSION_CONFIGS,
      {
        bot_id: botID,
        extension_id: extensionID,
        extension_keys: existBotExtension.config_keys,
      }
    );

    const configToDelete = await repoCompany.getConfigsTemplatesByField({
      "configs_templates.extension_id": extensionID,
    });

    if (!configToDelete.length) {
      throw new Error(`Configs not found for extension ID : ${extensionID}`);
    }

    for (const config of configToDelete) {
      await repoCompany.deleteCompanyConfig({
        "company_configs.bot_id": botID,
        "company_configs.config_template_id": config.uuid_unique,
      });
    }

    return await repoBots.deleteBotExtension({
      bot_id: botID,
      "extra_bots_extensions.extension_id": extensionID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const getBotConfigs = async (data) => {
  try {
    const { bot_id } = data;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": bot_id,
    });
    if (!botField) {
      throw new Error(`Bot: ${bot_id} not found.`);
    }

    const botConfigs = await repoCompany.getCompanyConfigByField({
      "company_configs.bot_id": bot_id,
      "company_configs.company_id": botField.company_id,
    });
    if (!botConfigs || botConfigs.length === 0) {
      throw new Error(`Bot: ${bot_id} configs not found.`);
    }

    const [botPrompt] = await repoPrompts.getByField({
      "prompts.bot_id": bot_id,
      "prompts.type": 0,
      "prompts.status": true,
    });
    if (!botPrompt) {
      throw new Error(`Bot: ${bot_id} has no active prompts.`);
    }

    const { metadata } = botPrompt;

    let botPromptMetadata = {};
    try {
      if (metadata) {
        botPromptMetadata =
          typeof metadata === "object" ? metadata : JSON.parse(metadata);
      }
    } catch (err) {
      console.error("Invalid metadata JSON:", err.message);
      botPromptMetadata = {};
    }

    const availableImages = botPromptMetadata?.available_images ?? null;

    const [botWhitelistPrompt] = await repoPrompts.getByField({
      "prompts.bot_id": bot_id,
      "prompts.type": 1,
      "prompts.status": true,
    });

    return [
      ...botConfigs,
      {
        template_key: "PROMPT",
        data: botPrompt.data,
        extension_category_name: "PROMPT",
        extension_category_dynamic: false,
      },
      {
        template_key: "PROMPT_AVAILABLE_IMAGES",
        data: availableImages ? JSON.stringify(availableImages) : "",
        extension_category_name: "PROMPT",
        extension_category_dynamic: false,
      },
      {
        template_key: "PROMPT_WHITELIST",
        data: botWhitelistPrompt ? botWhitelistPrompt.data : "",
        extension_category_name: "PROMPT",
        extension_category_dynamic: false,
      },
    ];
  } catch (error) {
    throw new Error(error);
  }
};

const getAdminWhitelist = async (companyID) => {
  const accountsField = await repoAccounts.getAccountByField({
    "accounts.company_id": companyID,
    "roles.key": "ADMIN",
  });

  const activeAccounts = accountsField.filter((account) => !!account.status);

  const whitelist = activeAccounts
    .filter((account) => account.phone && account.phone.length > 10)
    .map((account) => account.phone);

  const emailList = [
    ...new Set(
      activeAccounts
        .filter((account) => account.email)
        .map((account) => account.email)
    ),
  ];

  return { whitelist, emailList };
};

const sendMessageToAdmins = async (data, body) => {
  try {
    let { botID, companyID } = data;
    const { message } = body;

    if (!message) {
      throw new Error("Message is required.");
    }

    const { whitelist: adminWhitelist } = await getAdminWhitelist(companyID);
    if (!adminWhitelist || adminWhitelist.length === 0) {
      throw new Error(`No admins found for company ${companyID}`);
    }

    if (botID) {
      const [existinBot] = await repoBots.getBotsByField({
        "bots.company_id": companyID,
        "bots.uuid_unique": botID,
        "bots.suspended": false,
      });

      if (!existinBot) {
        botID = null;
      }
    }

    if (!botID) {
      const [activeBot] = await repoBots.getBotsByField({
        "bots.company_id": companyID,
        "bots.suspended": false,
      });

      if (!activeBot) {
        console.log(`No active bot found for company ${companyID}`);
        return;
      }

      botID = activeBot.uuid_unique;
    }

    for (const phone of adminWhitelist) {
      const phoneNumber = phone.replace(/\D/g, "");

      if (phoneNumber.length < 10) {
        continue;
      }

      await sendMessageBot({ botID }, { message, phone }, { isAdmin: true });
    }

    return true;
  } catch (error) {
    console.error(`Error in sendMessageToAdmins: ${error.message}`);
    return false;
  }
};

const getSuperAdminWhitelist = async () => {
  const superAdminAccounts = await repoAccounts.getAccountByField({
    "roles.key": "SUPERADMIN",
  });
  if (superAdminAccounts.length === 0) return;

  const whitelist = superAdminAccounts
    .filter((account) => account.phone?.trim() && account.phone.length > 10)
    .map((account) => account.phone);

  return whitelist;
};

const getBotWhitelist = async (companyID) => {
  try {
    const { whitelist } = await getAdminWhitelist(companyID);
    const superAdmins = await getSuperAdminWhitelist();

    return {
      data: whitelist,
      superAdmins,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const getBotBlacklist = async (companyID, botID) => {
  try {
    const botBlacklistFields = await repoBlacklist.getByField({
      "blacklist.company_id": companyID,
      "blacklist.bot_id": botID,
    });

    const blacklist = [];

    botBlacklistFields.map((member) => {
      blacklist.push(member.phone);
    });

    return {
      data: blacklist,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const sendBotWhitelist = async (
  data,
  singleAccount = null,
  isSuperAdmin = false
) => {
  try {
    let whitelist,
      isRemoved = false;

    if (isSuperAdmin) {
      const { phone, remove } = singleAccount;
      if (!phone || phone.length <= 10) {
        return;
      }

      whitelist = [phone];
      isRemoved = remove || false;

      const instanceBotsFields = await repoAWS.getInstanceBotsByField({});
      if (instanceBotsFields.length === 0) {
        return;
      }

      instanceBotsFields.map(async (instanceBotField) => {
        const { bot_id } = instanceBotField;
        const botQueue = createBotQueue(bot_id);

        await sendDataToInstance(botQueue, BOT_EVENTS.SET_BOT_WHITELIST, {
          bot_id,
          whitelist,
          superAdmins: await getSuperAdminWhitelist(),
          isRemoved,
        });
      });
    } else {
      const { bot_id } = data;

      const [botField] = await repoBots.getBotsByField({
        "bots.uuid_unique": bot_id,
      });
      if (!botField) {
        return;
      }

      const { company_id: companyID } = botField;

      if (singleAccount) {
        const { phone, remove } = singleAccount;
        if (!phone || phone.length <= 10) {
          return;
        }
        whitelist = [phone];
        isRemoved = remove ? remove : false;
      } else {
        const { whitelist: whitelist1 } = await getAdminWhitelist(companyID);
        whitelist = whitelist1;
        if (whitelist.length === 0) return;
      }

      const [instanceBotField] = await repoAWS.getInstanceBotsByField({
        "aws_instances_bots.bot_id": bot_id,
      });
      if (!instanceBotField) return;

      const superAdmins = await getSuperAdminWhitelist();
      const queue = createBotQueue(bot_id);

      await sendDataToInstance(queue, BOT_EVENTS.SET_BOT_WHITELIST, {
        bot_id,
        whitelist,
        superAdmins,
        isRemoved,
      });
    }
  } catch (error) {
    throw new Error(error);
  }
};

const sendBotBlacklist = async (data) => {
  try {
    const { bot_id } = data;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": bot_id,
    });
    if (!botField) {
      return;
    }

    const botBlacklistFields = await repoBlacklist.getByField({
      "blacklist.bot_id": bot_id,
    });

    const blacklist = [];

    botBlacklistFields.map((member) => {
      blacklist.push(member.phone);
    });

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": bot_id,
    });
    if (!instanceBotField) return;

    const queue = createBotQueue(bot_id);

    await sendDataToInstance(queue, BOT_EVENTS.SET_BOT_BLACKLIST, {
      bot_id,
      blacklist,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const checkBotPrompt = async (botID) => {
  try {
    const [promptField] = await repoPrompts.getByField({
      "prompts.bot_id": botID,
    });

    if (!promptField) {
      const [botField] = await repoBots.getBotsByField({
        "bots.uuid_unique": botID,
      });
      if (!botField) {
        throw new Error(`Bot: ${botID} not found.`);
      }

      const { company_id: companyID } = botField;
      const queryParams = {
        companyID,
        botID,
      };

      const bodyParams = {
        name: "Coftech Assistant",
        data: "You're a Expert Assistant...",
        type: 0,
        status: 1,
      };

      await modelPrompt.createPrompt(queryParams, bodyParams);
    }
  } catch (error) {
    throw new Error(error);
  }
};

const getOpenaiCosts = async (query, body) => {
  const { companyID, botID } = query;

  try {
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.company_id": companyID,
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const [adminKeyField] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "ADMIN_API_KEY",
    });
    if (!adminKeyField || !adminKeyField.data || adminKeyField.data === "") {
      throw new Error(`Admin key not found for company ${companyID}`);
    }

    return await getOrganizationCosts(adminKeyField.data, body);
  } catch (error) {
    throw new Error(error);
  }
};

const getBotSummary = async (query) => {
  const { companyID, botID, type, from, to, detailed } = query;

  try {
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.company_id": companyID,
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const { status, suspended } = botField;

    if (!status) {
      throw new CustomError(
        "BOT_INACTIVE",
        "A summary was requested, but the bot is inactive, so the event will be removed."
      );
    }

    if (suspended) {
      throw new CustomError(
        "BOT_OFF",
        "A weekly summary was requested, but the bot is suspended and the report could not be sent."
      );
    }

    const fromDate = dayjs.unix(from);
    const toDate = to ? dayjs.unix(to) : null;
    const now = dayjs().endOf("day");

    if (type === "RANGE") {
      if (fromDate.isAfter(toDate)) {
        throw new Error("From date cannot be after To date.");
      }
      if (toDate.isAfter(now)) {
        throw new Error("To date cannot be in the future.");
      }
    } else if (type === "DAILY" && fromDate.isAfter(now)) {
      throw new Error("From date cannot be in the future.");
    }

    const date =
      type === "RANGE"
        ? {
          from: fromDate.format("YYYY-MM-DD HH:mm:ss"),
          to: toDate.format("YYYY-MM-DD HH:mm:ss"),
        }
        : fromDate.format("YYYY-MM-DD HH:mm:ss");

    const botSummary = await repoBots.getSummary({
      bot_id: botID,
      type,
      date,
    });

    const summaries = botSummary.map((summary) => ({
      date: dayjs(summary.message_date).format("YYYY-MM-DD"),
      messages: summary.total_messages,
      senders: summary.total_senders,
    }));

    const result = botSummary.reduce(
      (acc, summary) => {
        acc.total_messages += summary.total_messages;
        acc.total_senders += summary.total_senders;
        return acc;
      },
      { total_messages: 0, total_senders: 0 }
    );

    let topics = null;
    if (detailed) {
      try {
        topics = await generateTopicAnalysis(companyID, botID, date, type);
      } catch (error) {
        logger.error(`Error in generateTopicAnalysis: ${error.message}`);
      }
    }

    return {
      values: summaries,
      date: type === "RANGE" ? `${date.from} - ${date.to}` : date,
      total_messages: result.total_messages,
      total_senders: result.total_senders,
      ...(detailed && topics ? { ...topics } : {}),
    };
  } catch (error) {
    logger.error(`Error in getBotSummary: ${error.message}`);
    throw error;
  }
};

const getAIConfiguration = async (companyID, botID) => {
  let [config] = await repoCompany.getCompanyConfigByField({
    "company_configs.company_id": companyID,
    "company_configs.bot_id": botID,
    "configs_templates.owner_type": "extension",
    "configs_templates.key": "BRAIN_OPENROUTER_KEY",
  });
  let useOpenRouter = true;

  if (!config || config?.data == "") {
    [config] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "OPENAI_KEY",
    });
    useOpenRouter = false;
  }

  if (!config || config?.data == "") {
    throw ApiError(
      400,
      "AI not configured for bot",
      ErrorCodes.BOT_NOT_FOUND,
      {}
    );
  }

  return { apiKey: config.data, useOpenRouter };
};

const generateTopicAnalysis = async (companyID, botID, date, type) => {
  const toon = await import("@toon-format/toon");
  const [timezoneConfig] = await repoCompany.getCompanyConfigByField({
    "configs_templates.key": "BOT_TIMEZONE",
    "company_configs.bot_id": botID,
  });

  const { messages, total_unique_participants, total_daily_participants } =
    await repoBots.getSummaryMessages({
      bot_id: botID,
      date,
      timezone: timezoneConfig.data,
      type,
    });

  const [promptField] = await repoSystemPrompts.getByField({
    "system_prompts.key": "SYSTEM_TOPIC_ANALYSIS",
  });

  if (!promptField) {
    throw new Error("Topic analysis prompt not found.");
  }

  const { apiKey, useOpenRouter } = await getAIConfiguration(companyID, botID);

  const openai = new OpenAI({
    ...(useOpenRouter && { baseURL: "https://openrouter.ai/api/v1" }),
    apiKey,
  });

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: promptField.prompt_data,
      },
      {
        role: "user",
        content: toon.encode({ messages }),
      },
    ],
    model: useOpenRouter ? "openrouter/auto" : "gpt-4o-mini",
    temperature: 0,
    ...(useOpenRouter && {
      usage: { include: true },
    }),
  });

  const contentRaw = completion.choices[0]?.message?.content || "";

  const contentClean = contentRaw
    .replace(/^```(yaml|toon|csv)?/gm, "")
    .replace(/```$/gm, "")
    .replace(/^\s*[{}]\s*$/gm, "")
    .replace(/[:\s]*\{\s*$/gm, ":")
    .trim();

  return {
    total_unique_participants,
    total_daily_participants,
    ...toon.decode(contentClean),
  };
};

const getBotChatStatus = async (query) => {
  try {
    const { companyID, botID, chatID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
      "bots.company_id": companyID,
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
    await sendDataToInstance(botQueue, BOT_EVENTS.GET_CHAT_STATUS, {
      bot_id: botID,
      chat_id: chatID,
    });

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const getBotUsedTokens = async (data) => {
  const { companyID, botID, fromDate, toDate } = data;

  try {
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company: ${companyID} not found.`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
      "bots.company_id": companyID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found for company ${companyID}.`);
    }

    const [useOpenRouter] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "BRAIN_OPENROUTER_KEY",
    });

    if (!useOpenRouter || !useOpenRouter.data || useOpenRouter.data === "") {
      return await getOpenaiCosts(data, {
        start_time: fromDate,
        end_time: toDate || null,
      });
    }

    return await repoBots.getBotUsedTokensByField((builder) => {
      builder.where({
        "completions_usages.company_id": companyID,
        "completions_usages.bot_id": botID,
      });

      if (toDate) {
        builder.whereBetween("completions_usages.date", [
          dayjs.unix(fromDate).format("YYYY-MM-DD"),
          dayjs.unix(toDate).format("YYYY-MM-DD"),
        ]);
      } else {
        builder.where(
          "completions_usages.date",
          "=",
          dayjs.unix(fromDate).format("YYYY-MM-DD")
        );
      }
    });
  } catch (error) {
    throw new Error(error);
  }
};

const saveBotUsedTokens = async (data) => {
  const { botID, tokens, credits, metadata, date } = data;

  try {
    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const { company_id } = botField;

    return await repoBots.saveBotUsedTokens({
      company_id,
      bot_id: botID,
      tokens,
      credits,
      metadata: JSON.stringify(metadata),
      date,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const updateChatAgent = async (query, body) => {
  const { companyID, botID, accountID } = query;
  const { phoneNumber, action } = body;

  try {
    if (!["claim", "release"].includes(action)) {
      throw new Error("Action must be claim or release.");
    }

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company: ${companyID} not found.`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
      "bots.company_id": companyID,
      "bots.status": true,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found for company ${companyID}.`);
    }

    if (botField.suspended) {
      throw new Error(
        `The chat can't be taken because the bot is suspended. Please activate the bot to take this chat.`
      );
    }

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": accountID,
      "accounts.company_id": companyID,
    });
    if (!accountField) {
      throw new Error(
        `Account: ${accountID} not found for company ${companyID}.`
      );
    }

    const phone = parsePhoneNumberFromString(`+${phoneNumber}`);
    if (!phone || !phone.isValid()) {
      throw new Error("Phone number must be a valid international number.");
    }

    let status, result;

    const [chatAssignedField] = await repoBots.getAssignedChatByField({
      "assigned_chats.company_id": companyID,
      "assigned_chats.bot_id": botID,
      "assigned_chats.phone_number": phoneNumber,
    });

    if (action == "claim") {
      if (chatAssignedField) {
        throw new Error(
          `Chat already taken by ${chatAssignedField.account_first_name} ${chatAssignedField.account_last_name}`
        );
      }

      result = await repoBots.saveAssignedChat({
        company_id: companyID,
        bot_id: botID,
        user_id: accountID,
        phone_number: phoneNumber,
        assigned_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      });

      status = 6;
    } else if (action == "release") {
      if (!chatAssignedField) {
        throw new Error("Chat not taken.");
      }

      result = await repoBots.deleteAssignedChatByField({
        "assigned_chats.company_id": companyID,
        "assigned_chats.bot_id": botID,
        "assigned_chats.phone_number": phoneNumber,
      });

      status = 1;
    }

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${botID} does not have an instance.`);
    }

    const botQueue = createBotQueue(botID);
    await sendDataToInstance(botQueue, BOT_EVENTS.UPDATE_CHAT_STATUS, {
      bot_id: botID,
      status,
      chat_id: phoneNumber,
    });

    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

const releaseChatAgent = async (query) => {
  const { botID, phoneNumber } = query;

  try {
    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found while releasing chat agent.`);
    }

    return await repoBots.deleteAssignedChatByField({
      "assigned_chats.bot_id": botID,
      "assigned_chats.phone_number": phoneNumber,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const socketAvailableChat = async (data) => {
  try {
    const { phoneNumber, botID, companyID } = data;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company: ${companyID} not found.`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
      "bots.company_id": companyID,
      "bots.status": true,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found for company ${companyID}.`);
    }

    const [assignedChat] = await repoBots.getAssignedChatByField({
      "assigned_chats.phone_number": phoneNumber,
      "assigned_chats.company_id": companyID,
      "assigned_chats.bot_id": botID,
    });

    const userData =
      (assignedChat && {
        id: assignedChat?.assigned_user_id,
        first_name: assignedChat?.assigned_user_first_name,
        last_name: assignedChat?.assigned_user_last_name,
        photo: assignedChat?.assigned_user_photo,
        assigned_at: assignedChat?.assigned_user_at,
      }) ||
      null;

    return {
      userData,
      botID,
      phoneNumber,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateBotSocialNetworkActivation = async ({
  botID,
  networkID,
  providerID,
}) => {
  try {
    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot "${botID}" not found.`);
    }

    const { company_id, identifier } = botField;

    const [existingActivation] = await repoBots.getBotSocialNetworkActivations({
      "bot_social_network_activations.bot_id": botID,
      "bot_social_network_activations.social_network_id": networkID,
    });

    if (!existingActivation) {
      throw new Error(
        `Activation for bot "${botID}" on network "${networkID}" not found.`
      );
    }

    const { uuid_unique: activationUUID, sn_provider_id: currentProviderID } =
      existingActivation;

    if (currentProviderID === providerID) {
      throw new Error(
        `Bot "${botID}" is already activated on network "${networkID}" with provider "${providerID}".`
      );
    }

    if (identifier) {
      throw new Error(`Bot "${botID}" must be unassigned from identifier.`);
    }

    const [newActivationProvider] =
      await socialNetworksProvidersRepository.getByField({
        "social_networks_providers.uuid_unique": providerID,
      });

    const { is_required_configs: isRequired } = newActivationProvider;

    if (isRequired) {
      await populateMissingConfigsForBot(botID, company_id, providerID);
    }

    await repoBots.updateBotSocialNetworkActivation(
      {
        "bot_social_network_activations.uuid_unique": activationUUID,
      },
      {
        sn_provider_id: providerID,
      }
    );

    return {
      updated: true,
      previous: currentProviderID,
      new: providerID,
    };
  } catch (error) {
    throw new Error(error.message || "Error updating bot activation.");
  }
};

const specialConfigs = [
  {
    key: "WHATSAPP_WEBHOOK_SECRET",
    getValue: () => uuidv4(),
  },
];

const populateMissingConfigsForBot = async (botID, companyID, providerID) => {
  const expectedConfigs = await repoCompany.getConfigsTemplatesByField({
    "configs_templates.sn_provider_id": providerID,
  });

  const existingConfigs = await repoCompany.getCompanyConfigByField({
    "company_configs.bot_id": botID,
    "configs_templates.sn_provider_id": providerID,
  });

  const missingConfigs = expectedConfigs.filter(({ uuid_unique }) => {
    return !existingConfigs.some(
      ({ config_template_id }) => config_template_id === uuid_unique
    );
  });

  for (const { uuid_unique, data_default, key } of missingConfigs) {
    const special = specialConfigs.find((cfg) => cfg.key === key);

    const dataValue = special ? special.getValue() : data_default || "";

    await repoCompany.saveCompanyConfig({
      company_id: companyID,
      bot_id: botID,
      config_template_id: uuid_unique,
      data: dataValue,
    });
  }

  return missingConfigs.length;
};

module.exports = {
  listBots,
  createBOT,
  updateBot,
  initializeBot,
  cancelInitializationBot,
  updateBotEvent,
  sendMessageBot,
  sendWhitelistMessagesBot,
  sendBotWhitelist,
  sendBotBlacklist,
  getBotWhitelist,
  getBotBlacklist,
  getBotInfo,
  stopBot,
  deleteBot,
  restartBot,
  startBot,
  listBotExtensions,
  saveBotExtension,
  updateBotExtension,
  getBotConfigs,
  sendMessageAsBot,
  sendMessageToAdmins,
  deleteBotExtension,
  getOpenaiCosts,
  getBotSummary,
  getAdminWhitelist,
  getBotChatStatus,
  getBotUsedTokens,
  saveBotUsedTokens,
  updateChatAgent,
  releaseChatAgent,
  socketAvailableChat,
  updateBotSocialNetworkActivation,
};
