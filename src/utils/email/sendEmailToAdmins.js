const repoBots = require("../../repositories/bots");
const modelBots = require("../../models/bots");
const repoCompany = require("../../repositories/company");
const logger = require("../logger");
const emailService = require("./emailService");
const { sendMessageToChannel } = require("../discordConnection");
const { discordEmbeds } = require("../discordTemplates");

const sendEmailToAdmins = async (emailData) => {
  try {
    const {
      bot_id,
      type,
      service = "DefaultService",
      details = "No details provided",
    } = emailData;

    if (!bot_id) {
      logger.warn("Bot ID is missing.");
      await sendDiscordFailed(null, "Bot ID is missing", emailData);
      return { success: false, reason: "Bot ID is missing", bot_id: null };
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": bot_id,
    });

    if (!botField) {
      logger.warn("Bot not found for ID", bot_id);
      await sendDiscordFailed(bot_id, "Bot not found", emailData);
      return { success: false, reason: "Bot not found", bot_id };
    }

    const { company_id, name } = botField;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": company_id,
    });

    if (!companyField) {
      logger.warn("Company not found for bot ID", bot_id);
      await sendDiscordFailed(bot_id, "Company not found", emailData, name);
      return {
        success: false,
        reason: "Company not found",
        bot_id,
        bot_name: name,
      };
    }

    const { uuid_unique, name: companyName } = companyField;
    const { emailList } = await modelBots.getAdminWhitelist(uuid_unique);

    if (emailList.length === 0) {
      logger.warn("No admin emails found for company", uuid_unique);
      await sendDiscordWarning(bot_id, name, companyName);
      return {
        success: false,
        reason: "No admin emails found",
        bot_id,
        bot_name: name,
        company_name: companyName,
      };
    }

    logger.info(
      `Sending email to ${emailList.length} recipients for company ${uuid_unique}, ${emailList}`
    );

    await emailService.sendNotification({
      type,
      service,
      details,
      recipients: emailList,
      botName: name,
    });

    await sendDiscordSuccess({
      bot_id,
      bot_name: name,
      company_name: companyName,
      recipients: emailList,
      type,
      service,
      details,
    });

    return {
      success: true,
      bot_id,
      bot_name: name,
      company_name: companyName,
      recipients: emailList,
      type,
      service,
      details,
    };
  } catch (error) {
    logger.error("Error processing email data:", error);
    await sendDiscordFailed(
      emailData.bot_id,
      error.message,
      emailData,
      null,
      error.stack
    );
    throw new Error(`Failed to process email data: ${error.message}`);
  }
};

const sendDiscordSuccess = async (emailResult) => {
  try {
    const webhookID = getWebhookID();
    const embed = discordEmbeds.emailAdminsSent(
      emailResult.bot_id,
      emailResult.bot_name,
      emailResult.company_name,
      emailResult.recipients,
      emailResult.type,
      emailResult.service,
      emailResult.details
    );

    await sendMessageToChannel(webhookID, { embeds: [embed] });
    logger.info(
      `Discord notification sent for successful email to ${emailResult.recipients.length} recipients for bot ${emailResult.bot_id}`
    );
  } catch (error) {
    logger.error("Failed to send Discord success notification:", error);
  }
};

const sendDiscordWarning = async (bot_id, bot_name, company_name) => {
  try {
    const webhookID = getWebhookID();
    const embed = discordEmbeds.emailAdminsWarning(
      bot_id,
      bot_name,
      company_name
    );

    await sendMessageToChannel(webhookID, { embeds: [embed] });
    logger.info(
      `Discord warning sent for bot ${bot_id} - no admin emails found`
    );
  } catch (error) {
    logger.error("Failed to send Discord warning notification:", error);
  }
};

const sendDiscordFailed = async (bot_id, reason, data, errorStack = null) => {
  try {
    const webhookID = getWebhookID();
    const embed = discordEmbeds.emailAdminsFailed(
      bot_id,
      reason,
      errorStack,
      data
    );

    await sendMessageToChannel(webhookID, { embeds: [embed] });
    logger.info(
      `Discord error notification sent for bot ${bot_id} - ${reason}`
    );
  } catch (error) {
    logger.error("Failed to send Discord error notification:", error);
  }
};

const getWebhookID = () => {
  return process.env.ENVIRONMENT == "development" ||
    process.env.ENVIRONMENT == "test"
    ? process.env.DISCORD_BACKEND_TEST
    : process.env.DISCORD_BACKEND_PROD;
};

module.exports = { sendEmailToAdmins };
