const dayjs = require("dayjs");

const repoAccounts = require("../../repositories/accounts");
const repoBots = require("../../repositories/bots");
const { socialMessagesQueueRepository } = require("../../repositories/social");
const repoCampaignsMessagesHistory = require("../../repositories/messagesHistory");
const repoCampaigns = require("../../repositories/campaigns");
const repoAWS = require("../../repositories/aws");
const repoUtils = require("../../repositories/utils");
const modelsNoco = require("../../models/noco");
const modelsCampaigns = require("../../models/campaigns");

const modelsBots = require("../../models/bots");
const modelsCompany = require("../../models/company");
const modelsPinecone = require("../../models/pinecone");

const { sendDataToInstance } = require("../sendDataToInstance");
const { getSocket } = require("../socket/socket");
const { messageProcess } = require("../messageProcess");
const MessageExtractorFactory = require("../extractors/MessageExtractorFactory");

const { createUserRoom } = require("../socket/createRoomName");
const createBotQueue = require("../../utils/rabbit/createBotQueue");
const { BOT_EVENTS } = require("../events");
const logger = require("../logger");
const qrCache = require("../qr/qrCache");

const { sendMessageToChannel } = require("../discordConnection");

const channelID =
  process.env.ENVIRONMENT == "development" || process.env.ENVIRONMENT == "test"
    ? process.env.DISCORD_BACKEND_TEST
    : process.env.DISCORD_BACKEND_PROD;

async function req_bot_summary(data) {
  const { bot_id, client, date, type, functionArgs, functionName } = data;

  try {
    let message = `No information was found for this date: ${date}`;
    const [botSummaryField] = await repoBots.getFlexibleSummary({
      bot_id,
      type,
      fromDate: date,
    });
    if (botSummaryField) {
      message = `
        Bot Summary:
        - Total Messages: ${botSummaryField.total_messages}
        - Total Senders: ${botSummaryField.total_senders}
        - Message Date: ${botSummaryField.message_date}
        `.trim();
    }
    await modelsBots.sendMessageBot(
      { botID: bot_id },
      { message, phone: client }
    );
    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": bot_id,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${bot_id} does not have an instance.`);
    }
    const botQueue = createBotQueue(bot_id);
    await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_MESSAGE_HISTORY, {
      bot_id,
      message,
      message_type: "chat",
      chat_id: client,
      messageTool: { functionArgs, functionName },
      isMessageToHistory: true,
    });
  } catch (error) {
    handleErrorEvent(
      error,
      bot_id,
      client,
      "req_bot_summary",
      "We could not process the summary. Please contact the administrator."
    );
  }
}

async function req_sales_summary(data) {
  const { bot_id, client, from_date, to_date, functionArgs, functionName } =
    data;

  try {
    let message = `No information was found yet for this date range: ${
      from_date === to_date ? from_date : `${from_date} - ${to_date}`
    }`;
    const summary = await modelsNoco.getSalesSummary({
      bot_id,
      from_date,
      to_date,
    });
    if (summary) {
      message = [
        `Here is your business summary from *${from_date}* to *${to_date}*:`,
        `Sales count: *${summary.sales_orders}*`,
        `Total revenue: *${parseFloat(summary.sales_amount).toFixed(2)} USD*`,
        `Net revenue: *${parseFloat(summary.sales_amount_net).toFixed(
          2
        )} USD*`,
        `Taxes: *${parseFloat(summary.sales_tax).toFixed(2)} USD*`,
        ``,
        `Branch purchase count: *${summary.purchases_orders}*`,
        `Branch expenses: *${parseFloat(
          summary.purchases_amount
        ).toFixed(2)} USD*`,
        `Net branch expenses: *${parseFloat(
          summary.purchases_amount_net
        ).toFixed(2)} USD*`,
      ].join("\n");
    }
    await modelsBots.sendMessageBot(
      { botID: bot_id },
      { message, phone: client }
    );
    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": bot_id,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${bot_id} does not have an instance.`);
    }
    const botQueue = createBotQueue(bot_id);
    await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_MESSAGE_HISTORY, {
      bot_id,
      message,
      message_type: "chat",
      chat_id: client,
      messageTool: { functionArgs, functionName },
      isMessageToHistory: true,
    });
  } catch (error) {
    handleErrorEvent(
      error,
      bot_id,
      client,
      "req_sales_summary",
      "We could not process the sales summary. Please contact the administrator."
    );
  }
}

async function req_sales_compare(data) {
  const {
    bot_id,
    client,
    sales_periods,
    chart_type,
    functionArgs,
    functionName,
  } = data;

  try {
    let message = `No information was found to perform comparisons`;
    let isMedia = false;
    const base64 = await modelsNoco.compareSalesSummary({
      bot_id,
      sales_periods,
      chart_type,
    });
    if (base64) {
      message = base64;
      isMedia = true;
    }
    await modelsBots.sendMessageBot(
      { botID: bot_id },
      { message, phone: client, isMedia }
    );
    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": bot_id,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${bot_id} does not have an instance.`);
    }
    const botQueue = createBotQueue(bot_id);
    await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_MESSAGE_HISTORY, {
      bot_id,
      message,
      message_type: "chat",
      chat_id: client,
      messageTool: { functionArgs, functionName },
      isMessageToHistory: true,
    });
  } catch (error) {
    handleErrorEvent(
      error,
      bot_id,
      client,
      "req_sales_compare",
      "We could not process the sales comparison. Please contact the administrator."
    );
  }
}

function qr_generated(data) {
  const { bot_id } = data;
  const socket = getSocket();

  qrCache.set(bot_id, data);
  qrCache.getAccountsForBot(bot_id).forEach((acc) => {
    const room = createUserRoom(acc);

    socket.to(room).emit("qr_generated", data);
  });
}

async function ready(data) {
  const { bot_id, infoUser } = data;
  const { user: number } = infoUser.wid;
  await modelsBots.updateBotEvent({ botID: bot_id }, { identifier: number });

  const socket = getSocket();
  const cacheAccounts = qrCache.getAccountsForBot(bot_id);
  for (const account of cacheAccounts) {
    const room = createUserRoom(account);

    socket.to(room).emit("device_ready", data);
  }

  qrCache.del(bot_id);
}

function disconnected(data) {
  const socket = getSocket();

  socket.to(data.bot_id).emit("bot_unlinked", {
    process: "unlinked",
    bot_id: data.bot_id,
    extra: { unlinked: true },
  });
}

function authenticated(data) {
  const { bot_id } = data;
  const socket = getSocket();

  qrCache.getAccountsForBot(bot_id).forEach((acc) => {
    const room = createUserRoom(acc);

    socket.to(room).emit("bot_activated", {
      process: "activated",
      bot_id: bot_id,
      extra: { activated: true },
    });
  });
}

async function sendBotData(data) {
  const { bot_id } = data;

  try {
    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": bot_id,
    });
    if (!botField) {
      logger.error(`[sendBotData] Bot: ${bot_id} not found.`);
    }

    const [bot_configs, company_configs, rag_configs, whitelist, blacklist] =
      await Promise.all([
        modelsBots.getBotConfigs(data),
        modelsCompany.getCompanyConfigs(data),
        modelsPinecone.getBotRagConfigs(data),
        modelsBots.getBotWhitelist(botField.company_id),
        modelsBots.getBotBlacklist(botField.company_id, bot_id),
      ]);

    const queue = createBotQueue(bot_id);

    await sendDataToInstance(queue, BOT_EVENTS.SAVE_BOT_DATA, {
      bot_id,
      bot_configs,
      company_configs,
      whitelist,
      blacklist,
      rag_configs,
    });
  } catch (error) {
    sendMessageToChannel(channelID, {
      message: `Error en sendBotData bot_id: ${bot_id}. ${error}`,
    });
    logger.error(`[sendBotData] Error: ${error.message}`, error);
    throw error;
  }
}

const handleWhatsappEvents = async (data) => {
  /*eslint-disable*/
  switch (data.event) {
    case "loading_screen":
      console.log("loading_screen:", data);
      break;
    case "authenticated":
      authenticated(data);
      break;
    case "auth_failure":
      console.log("auth_failure:", data);
      break;
    case "qr_generated":
      qr_generated(data);
      break;
    case "disconnected":
      disconnected(data);
      break;
    case "ready":
      ready(data);
      break;
    case "start_queue":
      start_queue(data);
      break;
    case "campaigns_queue":
      campaigns_queue(data);
      break;
    case "request_campaign_message":
      request_campaign_message(data);
      break;
    case "campaigns_message_status":
      campaigns_message_status(data);
      break;
    case "req_bot_summary":
      req_bot_summary(data);
      break;
    case "req_sales_summary":
      req_sales_summary(data);
      break;
    case "req_sales_compare":
      req_sales_compare(data);
      break;
    case "update_customer_support_logs":
      update_customer_support(data);
      break;

    case "get_bot_data":
      await sendBotData(data);
      break;
    default:
      break;
  }
  /*eslint-enable*/
};

const start_queue = async (data) => {
  try {
    const [queueMessages] =
      await socialMessagesQueueRepository.getMessageQueueList(data.bot_id);

    if (!queueMessages) return;

    const messagesList = [];
    
    let lastMessageType = "text";
    let lastChatId = null;
    let lastMessageAuthor = null;
    let lastTimestamp = Date.now();
    let lastCaption = null;
    let lastIsGroup = false;

    const queueMessagesList = queueMessages.uuid_uniques.split(",");

    for (const uuid of queueMessagesList) {
      try {
        await socialMessagesQueueRepository.updateMessageQueueStatus(uuid);

        const [messageField] = await socialMessagesQueueRepository.getByField({
          "social_messages_queue.uuid_unique": uuid,
        });

        if (!messageField) {
          logger.warn(
            `[start_queue] Message skipped: Field not found for UUID ${uuid} in bot ${data.bot_id}`
          );
          continue;
        }

        const { message, created_at } = messageField;
        const wp_message = JSON.parse(message);
        
        const source = wp_message.source || 'web-whatsapp';
        const extractor = MessageExtractorFactory.createExtractor(wp_message, source);

        const messageId = extractor.extractMessageId();
        const body = await extractor.extractBody();
        const type = extractor.extractType();
        const sender = extractor.extractSender();
        const recipient = extractor.extractRecipient();
        const author = extractor.extractAuthor();
        const direction = extractor.extractDirection();
        const isGroup = extractor.isGroupMessage();
        const isBroadcast = extractor.isBroadcastMessage();
        const contactInfo = extractor.extractContactInfo();
        const extraData = await extractor.extractExtraData();

        await messageProcess(wp_message, data.bot_id, {
          update_create_at: created_at,
        });

        let chatId;
        if (isGroup) {
          chatId = extraData.group_id || sender;
        } else {
          chatId = direction === 'receive' ? sender : recipient;
        }

        const messageComposeObj = {
          messageId,
          body,
          type,
          chatId,
          sender,
          recipient,
          author,
          isGroup,
          isBroadcast,
          direction,
          timestamp: extraData.timestamp || Date.now(),
          caption: extraData.caption || null,
          extraData,
          contactInfo,
          providerMetadata: {
            source,
            botId: data.bot_id
          }
        };

        messagesList.push(messageComposeObj);

        lastMessageType = type;
        lastChatId = chatId;
        lastMessageAuthor = author || (isGroup ? author : sender); 
        lastTimestamp = messageComposeObj.timestamp;
        lastIsGroup = isGroup;
        
        if (type === "image" || type === "video") {
          lastCaption = extraData.caption || null;
        }

      } catch (innerError) {
        logger.error(`[start_queue] Error processing message UUID ${uuid}: ${innerError.message}`, {
          bot_id: data.bot_id,
          stack: innerError.stack
        });
        continue; 
      }
    }

    if (!messagesList?.length) {
      logger.warn(`[start_queue] Queue processed but no valid messages extracted for bot ${data.bot_id}`);
      return;
    }

    const queue = createBotQueue(data.bot_id);

    await sendDataToInstance(queue, BOT_EVENTS.MESSAGE_QUEUE, {
      bot_id: data.bot_id,
      
      messages: messagesList,
      
      message: messagesList.map(m => m.body),
      message_type: lastMessageType,
      chat_id: lastChatId,
      messageAuthor: lastMessageAuthor,
      timestamp: lastTimestamp,
      caption: lastCaption,
      isGroup: lastIsGroup,
    });

  } catch (error) {
    sendMessageToChannel(channelID, {
      message: `Error fatal en start_queue botid: ${data.bot_id}. ${error.message}`,
    });
    logger.error(`[start_queue] Fatal error botid: ${data.bot_id}. ${error.stack}`);
  }
};

const update_customer_support = async (data) => {
  const { action, bot_id, phone_number, chat_id, group_id } = data;

  try {
    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": bot_id,
    });
    if (!botField) {
      throw new Error(`Bot ID ${bot_id} not found.`);
    }
    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.company_id": botField.company_id,
      "accounts.phone": phone_number,
    });
    const [logField] = await repoUtils.getCustomerSupportLogByField({
      "customer_support_logs.company_id": botField.company_id,
      "customer_support_logs.bot_id": bot_id,
      "customer_support_logs.chat_id": chat_id,
      "customer_support_logs.group_id": group_id,
    });
    /*eslint-disable*/
    switch (action) {
      case "START":
        if (logField) {
          throw new Error(
            `Customer support log with chat_id ${chat_id} already started.`
          );
        }
        await repoUtils.saveCustomerSupportLog({
          company_id: botField.company_id,
          account_id: null,
          bot_id,
          chat_id,
          group_id,
          started_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        });
        break;
      case "ASSIGN":
        if (logField && !["STARTED", "REASSIGNING"].includes(logField.status)) {
          throw new Error(
            `Customer support log with chat_id ${chat_id} already started.`
          );
        }
        await repoUtils.updateCustomerSupportLog(
          { "customer_support_logs.uuid_unique": logField.uuid_unique },
          {
            status: "IN_PROGRESS",
            account_id: accountField.uuid_unique,
          }
        );
        break;
      case "FINISH":
        if (!logField) {
          await repoUtils.saveCustomerSupportLog({
            company_id: botField.company_id,
            account_id: accountField.uuid_unique,
            bot_id,
            chat_id,
            group_id,
            status: "FINISHED",
            ended_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          });
        }
        await repoUtils.updateCustomerSupportLog(
          { "customer_support_logs.uuid_unique": logField.uuid_unique },
          {
            status: "FINISHED",
            ended_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          }
        );
        break;
      case "EXPIRE":
        if (!logField) {
          throw new Error(
            `Customer support log with chat_id ${chat_id} not found.`
          );
        }
        await repoUtils.updateCustomerSupportLog(
          { "customer_support_logs.uuid_unique": logField.uuid_unique },
          {
            status: "EXPIRED",
            ended_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          }
        );
        break;
      case "REASSIGN":
        if (!logField) {
          throw new Error(
            `Customer support log with chat_id ${chat_id} not found.`
          );
        }
        const prevMetadata = JSON.parse(logField.metadata || "{}");
        const participants = [
          ...(prevMetadata.participants || []),
          logField.account_id,
        ];
        const uniqueParticipants = Array.from(new Set(participants));
        await repoUtils.updateCustomerSupportLog(
          { "customer_support_logs.uuid_unique": logField.uuid_unique },
          {
            account_id: null,
            status: "REASSIGNING",
            metadata: JSON.stringify({
              reasigned: true,
              participants: uniqueParticipants,
            }),
          }
        );
        break;
    }
    /*eslint-enable*/
  } catch (error) {
    sendMessageToChannel(channelID, {
      message: `Error en update_customer_support bot_id: ${bot_id}. ${error}`,
    });
  }
};

const campaigns_message_status = async (data) => {
  const { message_uuid, errors } = data;
  await repoCampaignsMessagesHistory.updateCampaignMessageStatus(message_uuid, {
    status: errors.length > 0 ? "ERROR" : "DONE",
    metadata:
      errors.length > 0
        ? JSON.stringify({ error_code: errors[0], can_retry: false })
        : null,
  });
};

const request_campaign_message = async (data) => {
  const { campaign_id, bot_id } = data;

  try {
    const [campaignField] = await repoCampaigns.getCampaignsByField({
      "campaigns.uuid_unique": campaign_id,
      "campaigns.bot_id": bot_id,
    });
    if (!campaignField) {
      throw new Error(`Campaign: ${campaign_id} not found.`);
    }
    if (campaignField.status !== "IN_PROGRESS") {
      await modelsCampaigns.updateCampaignStatusOnInstance({
        campaignField,
        botID: bot_id,
        status: campaignField.status,
      });
      return await modelsCampaigns.updateCampaignLogEndedAt({
        campaignLogID: campaignLogField.uuid_unique,
      });
    }
    const [campaignLogField] = await repoCampaigns.getCampaignsLogsByField({
      "campaigns_logs.campaign_id": campaign_id,
      "campaigns_logs.ended_at": null,
    });
    if (!campaignLogField) {
      throw new Error(`Campaign log: ${campaign_id} not found.`);
    }
    const [lastMessage] =
      await repoCampaignsMessagesHistory.getLastCampaignMessage({
        "campaigns_messages_history.campaign_log_id":
          campaignLogField.uuid_unique,
        "campaigns_messages_history.bot_id": bot_id,
      });

    /*eslint-disable*/
    let sourceData;
    switch (campaignField.source) {
      case "BOT":
        sourceData = await modelsCampaigns.getCampaignDataBySource.bot(
          campaignField,
          lastMessage
        );
        break;
      default:
        throw new Error(`Unknown campaign source for ${campaignField.source}`);
    }
    /*eslint-enable*/

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": bot_id,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${bot_id} does not have an instance.`);
    }
    const { finish } = sourceData;
    if (finish) {
      return await Promise.all([
        repoCampaigns.updateCampaign(
          { "campaigns.uuid_unique": campaign_id },
          { status: "COMPLETED" }
        ),
        modelsCampaigns.updateCampaignStatusOnInstance({
          campaignField,
          botID: bot_id,
          status: "COMPLETED",
        }),
        modelsCampaigns.updateCampaignLogEndedAt({
          campaignLogID: campaignLogField.uuid_unique,
        }),
      ]);
    }
    const botQueue = createBotQueue(bot_id);
    await sendDataToInstance(botQueue, BOT_EVENTS.SEND_CAMPAIGN_MESSAGE, {
      bot_id,
      body: {
        campaign_id,
        source: campaignField.source,
        status: campaignField.status,
        phone: sourceData.phone,
        message: sourceData.message,
      },
    });
    const messageHistoryData = {
      campaign_log_id: campaignLogField.uuid_unique,
      company_id: campaignField.company_id,
      bot_id: campaignField.bot_id,
      source: campaignField.source,
      source_register_id: sourceData.register_id,
      status: "DONE",
      metadata: null,
    };
    await repoCampaignsMessagesHistory.saveCampaignMessage(messageHistoryData);
  } catch (e) {
    sendMessageToChannel(channelID, {
      message: `Error en request_campaign_message bot_id: ${bot_id}. ${e}`,
    });
  }
};

async function handleErrorEvent(error, bot_id, client, functionName, message) {
  sendMessageToChannel(channelID, {
    message: `Error en ${functionName} bot_id: ${bot_id}. ${error}`,
  });

  if (client) {
    try {
      await modelsBots.sendMessageBot(
        { botID: bot_id },
        {
          message: message,
          phone: client,
        }
      );
    } catch (sendError) {
      logger.error(
        `Error sending error message to client ${client}: ${sendError.message}`
      );
    }
  }

  throw new Error(`Error en ${functionName} bot_id: ${bot_id}. ${error}.`);
}

module.exports = { handleWhatsappEvents };
