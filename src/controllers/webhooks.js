const Joi = require("joi");
const axios = require("axios");
const modelWebhooks = require("../models/webhooks");
const {
  socialNetworksRepository,
  socialMessagesQueueRepository,
} = require("../repositories/social");
const repoBots = require("../repositories/bots");
const { validateWhatsAppWebhook } = require("../utils/metaValidations");
const logger = require("../utils/logger");
const { sendMessageToChannel } = require("../utils/discordConnection");
const { mapMessageType } = require("../utils/metaMessageTypeMap");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const createDiscordWebhook = async (req, res) => {
  const schema = Joi.object({
    channelID: Joi.string().required(),
    message: Joi.string(),
  });

  validateOrThrow(schema, req.body);

  const { channelID, message } = req.body;
  await sendMessageToChannel(channelID, { message });
  res.status(200).json({
    code: 200,
    status: true,
    data: {},
  });
};

const amazonSNSWebhook = async (req, res) => {
  const messageType = req.header("x-amz-sns-message-type");
  const body = req.body;

  const response = {
    message: "Event received",
  };

  if (messageType === "SubscriptionConfirmation" && body.SubscribeURL) {
    const allowedTopicArn = [
      process.env.AWS_SNS_RAG_TOPICARN,
      process.env.AWS_SNS_REPORT_SUMMARY_TOPICARN,
    ];
    if (!allowedTopicArn.includes(body.TopicArn)) {
      throw ApiError(
        400,
        "Invalid SNS topic",
        ErrorCodes.WEBHOOK_INVALID_SNS_TOPIC,
        { topicArn: body.TopicArn }
      );
    }

    await axios.get(body.SubscribeURL);

    response.message = "Subscription confirmed";
  }

  if (messageType === "Notification") {
    await modelWebhooks.handleSNS(body);
  }

  res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const verifyMetaWebhook = async (req, res) => {
  const paramsSchema = Joi.object({
    botID: Joi.string().uuid({ version: "uuidv4" }).required().messages({
      "string.guid": "bot must be a valid UUID",
      "any.required": "bot is required",
    }),
  });

  const querySchema = Joi.object({
    "hub.mode": Joi.string().valid("subscribe").required().messages({
      "any.only": "hub.mode must be 'subscribe'",
      "any.required": "hub.mode is required",
    }),
    "hub.verify_token": Joi.string().required().messages({
      "any.required": "hub.verify_token is required",
    }),
    "hub.challenge": Joi.string().required().messages({
      "any.required": "hub.challenge is required",
    }),
  });

  validateOrThrow(paramsSchema, req.params);
  validateOrThrow(querySchema, req.query);

  const { "hub.verify_token": verifyToken, "hub.challenge": challenge } =
    req.query;

  const { botID } = req.params;

  const validatedBot = await modelWebhooks.validateMetaWAAppBot(botID);

  const webhookSecret = validatedBot?.whatsapp_config?.WHATSAPP_WEBHOOK_SECRET;

  if (verifyToken === webhookSecret) {
    logger.info(`Meta Webhook verified successfully for bot ${botID}`);
    return res.status(200).send(challenge);
  } else {
    return res.status(403).json({
      error: "Invalid verify token",
    });
  }
};

const receiveMetaWebhook = async (req, res) => {
  const paramsSchema = Joi.object({
    botID: Joi.string().uuid({ version: "uuidv4" }).required().messages({
      "string.guid": "bot must be a valid UUID",
      "any.required": "bot is required",
    }),
  });

  validateOrThrow(paramsSchema, req.params);

  const { botID } = req.params;

  const [botField] = await repoBots.getBotsByField({
    "bots.uuid_unique": botID,
  });

  if (!botField) {
    throw ApiError(404, "Bot not found", ErrorCodes.BOT_NOT_FOUND, { botID });
  }

  const { identifier } = botField;

  const validation = validateWhatsAppWebhook(req.body);

  if (!validation.isValid) {
    logger.error("Meta Webhook validation error:", validation);
    return res.status(400).json({
      error: "Invalid webhook structure",
      details: validation.error.map((err) => err.message).join(", "),
    });
  }

  const [socialNetworkField] = await socialNetworksRepository.getByField({
    "social_networks.key": "WHATSAPP",
  });
  const { uuid_unique: socialNetworkID } = socialNetworkField;

  if (validation.type === "inbound_message") {
    const { messages } = validation.data;

    for (const message of messages) {
      const messageExists =
        await socialMessagesQueueRepository.checkInboundMessageExists(
          message.id,
          botID
        );

      if (messageExists) {
        logger.info(`Inbound message already exists: ${message.id}`);
        continue;
      }

      const formatedMessage = {
        event: "new_message",
        client: identifier,
        network: "WHATSAPP",
        data: validation.rawPayload,
        bot_id: botID,
        source: "meta",
      };

      await socialMessagesQueueRepository.save({
        bot_id: botID,
        network_id: socialNetworkID,
        message: JSON.stringify(formatedMessage),
        message_type: mapMessageType(message.type),
        sender: message.from,
        direction: "inbound",
      });
    }
  }

  res.status(200).json({ received: true });
};

module.exports = {
  createDiscordWebhook,
  amazonSNSWebhook,
  verifyMetaWebhook,
  receiveMetaWebhook,
};
