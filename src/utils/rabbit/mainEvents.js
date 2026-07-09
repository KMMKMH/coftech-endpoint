const { sendMessageToChannel } = require("../discordConnection");
const repoBots = require("../../repositories/bots");
const repoCompany = require("../../repositories/company");
const repoAccounts = require("../../repositories/accounts");
const { repoBlacklist } = require("../../repositories/blacklist");
const { repoDashLogs } = require("../../repositories/dashboardLogs");
const modelsSocial = require("../../models/social");
const modelDashLog = require("../../models/dashboardLogs");

const modelsBots = require("../../models/bots");
const modelsBlacklist = require("../../models/blacklist");
const modelsGoogle = require("../../models/google");
const modelsCallCenter = require("../../models/callcenter");

const { sendEmailToAdmins } = require("../email/sendEmailToAdmins");
const { discordEmbeds } = require("../discordTemplates");

const { generatePaymentLink } = require("../generatePayment");
const { getSocket } = require("../socket/socket");
const { messageProcess } = require("../messageProcess");
const qrCache = require("../qr/qrCache");
const { utilActionType, utilResourceType } = require("../utilDashLogs");

const handleMainEvents = async (data) => {
  const { event, bot_id, extra, msg, process: botProcess } = data;
  const socket = getSocket();

  /*eslint-disable*/
  switch (event) {
    case "bot_steps":
      const [botField] = await repoBots.getBotsByField({
        "bots.uuid_unique": bot_id,
      });
      if (!botField) return;

      const [companyField] = await repoCompany.getCompanyByField({
        "company.uuid_unique": botField.company_id,
      });

      const webhookID =
        process.env.ENVIRONMENT == "development" ||
        process.env.ENVIRONMENT == "test"
          ? process.env.DISCORD_BOT_TEST
          : process.env.DISCORD_BOT_PROD;

      if (extra?.disconnected === true) {
        await repoDashLogs.save({
          user_id: null,
          action_type: utilActionType.Disconnect,
          resource_type: utilResourceType.Bot,
          name: botField.name,
          company_id: botField.company_id,
          status: "success",
          metadata: {
            bot: {
              botID: bot_id,
              botName: botField.name,
            },
            reason: "The bot has disconnected from WhatsApp",
            ...(extra?.details && { details: extra.details }),
          },
        });
      }

      const discordMessage = discordEmbeds.botSteps({
        msg,
        botName: botField.name,
        companyName: companyField.name,
        extra,
      });

      await sendMessageToChannel(webhookID, {
        message: discordMessage,
      });

      if (extra?.config) {
        const accountField = await repoAccounts.getAccountByField({
          "accounts.company_id": companyField.uuid_unique,
          "roles.key": "ADMIN",
        });

        for (const account of accountField) {
          if (account.phone) {
            await modelsBots.sendMessageAsBot(
              account.phone,
              `Bot ${botField.name} suspended ${msg} ${extra.config.replaceAll(
                "_",
                ""
              )}`
            );
          }
        }
      }
      break;

    case "completion_generated":
      await modelsBots.saveBotUsedTokens({
        botID: bot_id,
        tokens: data.tokens,
        credits: data.credits,
        metadata: data.metadata,
        date: data.date,
      });
      break;

    case "new_message":
      const { network, data: body } = data;
      const type = body.type;
      const from = data.data.from.split("@")[0];

      await modelsSocial.saveMessageQueue(bot_id, data, type, network, from);
      break;

    case "message_create":
    case "message_edit":
    case "message_revoked":
      messageProcess(data, data.bot_id);
      break;

    case "bot_info":
      socket.to(data.bot_id).emit("bot_info", data);
      break;

    case "bot_action":
      if (botProcess !== "qr_time_expired") {
        await repoBlacklist.delete({
          "blacklist.bot_id": bot_id,
          "blacklist.type": "BOT",
        });
      }

      if (botProcess === "suspended") {
        await repoBots.updateBot({ "bots.uuid_unique": bot_id }, { ...extra });
        socket.to(bot_id).emit("bot_suspended", {
          process: "suspended",
          bot_id: bot_id,
          extra: { ...extra },
        });
      } else if (botProcess === "canceled_initialization") {
        socket.to(bot_id).emit("canceled_initialization", {
          process: "canceled_initialization",
          bot_id: bot_id,
          extra: { ...extra },
        });
      } else if (botProcess === "deleted_identifier") {
        await repoBots.updateBot(
          { "bots.uuid_unique": bot_id },
          { identifier: "", suspended: true }
        );
      } else if (botProcess === "qr_time_expired") {
        qrCache.onBotExpired(bot_id);
      }
      break;

    case "generatePaymentLink":
      await generatePaymentLink(data);
      break;

    case "bot_action_google":
      switch (botProcess) {
        case "check_calendar_availability":
          await modelsGoogle.getAvailableCalendarEvent(data);
          break;
        case "create_calendar_event":
          await modelsGoogle.createCalendarEvent(data);
          break;
        case "get_calendar_event":
          await modelsGoogle.getCalendarEvent(data);
          break;
        case "delete_calendar_event":
          await modelsGoogle.deleteCalendarEvent(data);
          break;
        case "update_calendar_event":
          await modelsGoogle.updateCalendarEvent(data);
          break;
        case "confirm_calendar_reminder":
          await modelsGoogle.updateBotReminderBooking(data, "confirmed");
          break;
        default:
          console.log("No process found");
      }
      break;

    case "get_call_center_departments":
      await modelsCallCenter.sendCallCenterDepartments(data);
      break;

    case "bot_department_derivation":
      await modelsCallCenter.saveDepartmentDerivationQueue(data);
      break;

    case "cancel_department_queue":
      await modelsCallCenter.cancelDepartmentQueue(data);
      break;

    case "send_email_to_admins":
      await sendEmailToAdmins(data);
      break;

    case "unassign_chat_agent":
      await modelsBots.releaseChatAgent({
        botID: data.bot_id,
        phoneNumber: data.phone,
      });
      break;
    case "save_error_log":
      await modelDashLog.saveErrorLog(data);
      break;

    case "response_chat_status":
      socket.to(bot_id).emit("response_chat_status", data);
      break;

    // Blacklist events
    case "bot_block_phone":
      await modelsBlacklist.saveBlacklist(
        { botID: bot_id },
        { phone: data.phone }
      );
      break;

    case "bot_unblock_phone":
      await modelsBlacklist.deleteBlacklist(
        { botID: bot_id },
        { phone: data.phone }
      );
      break;

    default:
      console.log("Event not found");
  }
  /*eslint-enable*/
};

module.exports = { handleMainEvents };
