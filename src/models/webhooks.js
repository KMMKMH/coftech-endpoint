const Joi = require("joi");
const logger = require("../utils/logger");
const modelFilemanager = require("../models/fileManager");
const { repoDashLogs } = require("../repositories/dashboardLogs");
const repoBots = require("../repositories/bots");
const repoCompany = require("../repositories/company");
const { emitNotification } = require("../utils/socket/notifications");
const { utilActionType, utilResourceType } = require("../utils/utilDashLogs");
const { emitUploadComplete } = require("../utils/socket/progressBar");
const { deleteEventBridgeRule } = require("../utils/eventBridgeService");
const { sendMessageToChannel } = require("../utils/discordConnection");
const { discordEmbeds } = require("../utils/discordTemplates");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const handleSNS = async (body) => {
  const { Message } = body;

  try {
    const data = JSON.parse(Message);
    const { action, ...params } = data;

    /* eslint-disable */
    switch (action) {
      case "notification":
        const { roomID, event, message } = params;
        emitNotification(roomID, event, message);
        break;
      case "save_metadata":
        const schema = Joi.object({
          companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
          filename: Joi.string().required(),
          identificator: Joi.string().uuid({ version: "uuidv4" }).required(),
          size: Joi.number().required(),
          source: Joi.string().default("filemanager").required(),
          userID: Joi.string().required(),
          description: Joi.string().optional(),
        });

        const values = validateOrThrow(schema, params);

        const { companyID, userID, filename } = values;

        await modelFilemanager.uploadFileMetadata(
          { companyID },
          {
            filename,
            size: values.size,
            source: values.source,
            identificator: values.identificator,
            userID: userID,
            description: values.description || null,
          }
        );

        await repoDashLogs.save({
          user_id: userID,
          action_type: utilActionType.Upload,
          resource_type: utilResourceType.File,
          name: filename || null,
          status: "success",
          company_id: companyID,
          metadata: {
            ...values,
          },
        });

        if (values.source.toLowerCase() == "filemanager") {
          emitUploadComplete(
            userID,
            values.identificator,
            "File uploaded successfully!"
          );
        }

        break;
      case "save_error_dashlog":
        const errorSchema = Joi.object({
          botID: Joi.string().required(),
          companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
          errorCode: Joi.string().required(),
          errorMessage: Joi.string().required(),
          resourceType: Joi.string().default("Report").required(),
          metadata: Joi.object().optional(),
        });

        const errorValues = validateOrThrow(errorSchema, params);

        await repoDashLogs.save({
          user_id: null,
          action_type: utilActionType.Error,
          resource_type: utilResourceType.Bot,
          name: `Report Error - ${errorValues.errorCode}`,
          status: "failure",
          company_id: errorValues.companyID,
          metadata: {
            botID: errorValues.botID,
            errorCode: errorValues.errorCode,
            errorMessage: errorValues.errorMessage,
            ...errorValues.metadata,
          },
        });

        if (errorValues.errorCode === "BOT_INACTIVE") {
          try {
            await deleteEventBridgeRule(errorValues.botID);
            logger.info(
              `[SNS] EventBridge rule deleted for bot ${errorValues.botID}`
            );
          } catch (deleteError) {
            logger.error(
              `[SNS] Failed to delete EventBridge rule: ${deleteError}`
            );
          }
        }

        if (
          errorValues.errorCode !== "BOT_OFF" &&
          errorValues.errorCode !== "BOT_INACTIVE"
        ) {
          const webhookID =
            process.env.ENVIRONMENT === "development" ||
            process.env.ENVIRONMENT === "test"
              ? process.env.DISCORD_AWS_TEST
              : process.env.DISCORD_AWS_PROD;

          if (webhookID) {
            try {
              const { botID, companyID, errorCode, errorMessage, metadata } =
                errorValues;

              await sendMessageToChannel(webhookID, {
                embeds: [
                  discordEmbeds.reportSummaryError(
                    botID,
                    companyID,
                    errorCode,
                    errorMessage,
                    metadata
                  ),
                ],
              });
            } catch (discordError) {
              logger.error(
                `[SNS] Failed to send Discord notification: ${discordError}`
              );
            }
          }
        }

        logger.info(`[SNS] Error dashlog saved for bot ${errorValues.botID}`);
        break;
      default:
        logger.error(`[SNS] Unknown action: ${action}`);
      /* eslint-enable */
    }
  } catch (e) {
    logger.error(`Error: [SNS] Error while handling message: ${e}`);
  }
};

const validateMetaWAAppBot = async (botID) => {
  const [botField] = await repoBots.getBotsByField({
    "bots.uuid_unique": botID,
  });

  if (!botField) {
    throw ApiError(404, "Bot not found", ErrorCodes.BOT_NOT_FOUND, { botID });
  }

  const { company_id } = botField;

  const [whatsapp_webhook_provider] = await repoCompany.getCompanyConfigByField(
    {
      "company_configs.company_id": company_id,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "provider",
      "configs_templates.key": "WHATSAPP_WEBHOOK_SECRET",
    }
  );

  if (
    !whatsapp_webhook_provider?.data ||
    !whatsapp_webhook_provider?.data.trim()
  ) {
    throw ApiError(
      400,
      "Bot webhook secret not configured",
      ErrorCodes.WEBHOOK_VERIFICATION_FAILED,
      { botID, company_id }
    );
  }

  let botConfig = {
    ...botField,
    whatsapp_config: {
      WHATSAPP_WEBHOOK_SECRET: whatsapp_webhook_provider.data.trim(),
    },
  };

  return botConfig;
};

module.exports = {
  handleSNS,
  validateMetaWAAppBot,
};
