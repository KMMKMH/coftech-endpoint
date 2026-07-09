const logger = require("../../logger");
const dayjs = require("dayjs");

const repoCompany = require("../../../repositories/company");
const repoCallCenter = require("../../../repositories/callcenter");

const { sendMessageBot } = require("../../../models/bots");

const monitorQueueChatTimeout = async () => {
  try {
    const now = dayjs();

    const queueChats = await repoCallCenter.getCallCenterQueueChatsByField(
      (builder) => {
        builder
          .where("status", "PENDING")
          .orWhere("status", "ASSIGNED")
          .orWhere("status", "REASSIGNED");
      }
    );

    if (!queueChats.length) {
      throw new Error("Queue chats not found with status PENDING.");
    }

    for (const chat of queueChats) {
      const {
        uuid_unique: queueChatID,
        bot_id: botID,
        phone,
        created_at,
      } = chat;

      const [queueTimeout] = await repoCompany.getCompanyConfigByField({
        "company_configs.bot_id": botID,
        "configs_templates.key": "CALL_CENTER_QUEUE_TIMEOUT",
        "configs_templates.owner_type": "extension",
      });

      if (!queueTimeout || !queueTimeout.data) {
        console.error(`Queue timeout not found for bot ${botID}.`);
        continue;
      }

      const [hours, minutes] = queueTimeout.data.split(":").map(Number);
      const queueTimeoutHours = hours + minutes / 60;

      const createdAt = dayjs(created_at);
      const timeElapsed = now.diff(createdAt, "minute");

      const timeElapsedHours = timeElapsed / 60;

      if (parseFloat(timeElapsedHours) >= queueTimeoutHours) {
        await repoCallCenter.updateCallCenterQueueChat(
          { uuid_unique: queueChatID },
          { status: "TIMEOUT", timeout_notified_at: dayjs().format() }
        );
        const message = `All our agents are currently busy and we cannot handle your request right now. We apologize for the inconvenience. Please try contacting us again later.\nThank you for your understanding.`;
        await sendMessageBot({ botID }, { message, phone });
      }
    }
  } catch (error) {
    logger.error(`Error in monitorQueueChatTimeout: ${error.message}`);
  }
};

module.exports = monitorQueueChatTimeout;
