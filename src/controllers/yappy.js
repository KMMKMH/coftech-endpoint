const Joi = require("joi");

const logger = require("../utils/logger");
const { ApiError } = require("../utils/errors/ApiError");
const { validateOrThrow } = require("../utils/middleware/joiValidator");
const ErrorCodes = require("../constants/errorCodes");
const { getYappyClient } = require("../utils/getYappyClient");
const { BOT_EVENTS } = require("../utils/events");
const repoPayments = require("../repositories/payments");
const repoAWS = require("../repositories/aws");

const { sendDataToInstance } = require("../utils/sendDataToInstance");
const createBotQueue = require("../utils/rabbit/createBotQueue");

const validateYappyPaymentStatus = async (req, res) => {
  const querySchema = Joi.object({
    orderId: Joi.string().required(),
    status: Joi.string().required(),
    domain: Joi.string().required(),
    hash: Joi.string().required(),
    confirmationNumber: Joi.string().required(),
  });

  const valueQuery = validateOrThrow(querySchema, req.query);

  const { orderId, status, hash, domain } = valueQuery;

  const [paymentProviderField] = await repoPayments.getPaymentsProviderByField({
    "payments_provider.name": "Yappy",
  });
  if (!paymentProviderField) {
    throw new ApiError(
      404,
      "Payment provider not found",
      ErrorCodes.PAYMENT_PROVIDER_NOT_FOUND
    );
  }

  const [paymentField] = await repoPayments.getLastPaymentsByField({
    "payments.reference": orderId,
    "payments.provider": paymentProviderField.uuid_unique,
  });

  if (!paymentField) {
    throw new ApiError(404, "Payment not found", ErrorCodes.PAYMENT_NOT_FOUND);
  }

  const {
    company_id: companyID,
    phone,
    bot_id: botID,
    metadata,
    amount,
  } = paymentField;
  const { uuid_unique: providerID } = paymentProviderField;

  const products =
    typeof metadata === "string" ? JSON.parse(metadata) : metadata;

  const [instanceBotField] = await repoAWS.getInstanceBotsByField({
    "aws_instances_bots.bot_id": botID,
  });
  if (!instanceBotField) {
    throw ApiError(
      404,
      "Bot instance not found for the given bot ID",
      ErrorCodes.BOT_INSTANCE_NOT_FOUND
    );
  }

  let yappyService;
  try {
    yappyService = await getYappyClient(companyID, botID);
  } catch (error) {
    logger.error(`Get yappy client error: ${error}`);
    throw ApiError(
      500,
      "Yappy configuration error",
      ErrorCodes.YAPPY_CONFIG_NOT_SET
    );
  }

  const isValidHash = yappyService.validateIPNHash(
    orderId,
    status,
    domain,
    hash
  );

  if (!isValidHash) {
    throw ApiError(400, "Invalid Yappy hash", ErrorCodes.YAPPY_INVALID_HASH);
  }

  const context = {
    companyID,
    phone,
    orderId,
    amount,
    metadata: valueQuery,
    status: status,
    providerID,
  };

  let notifyResult;
  try {
    notifyResult = await yappyService.notifyUser(botID, phone, status, context);
  } catch (error) {
    logger.error(`Failed to notify user: ${error}`);
    throw ApiError(
      500,
      "Failed to notify user",
      ErrorCodes.YAPPY_NOTIFY_FAILED
    );
  }

  const { name, msg } = notifyResult;
  const botQueue = createBotQueue(botID);
  await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_MESSAGE_HISTORY, {
    bot_id: botID,
    message: msg || `Payment status updated: ${name}`,
    message_type: "chat",
    chat_id: phone,
    messageTool: {
      functionArgs: products,
      functionName: "handlePaymentRequest",
    },
    isMessageToHistory: true,
    clearChat: true,
  });

  res.status(200).json({
    success: isValidHash,
  });
};

module.exports = { validateYappyPaymentStatus };
