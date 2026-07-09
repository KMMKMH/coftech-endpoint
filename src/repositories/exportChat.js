const db = require("../utils/db");
const repoBots = require("./bots");
const repoContacts = require("./social");
const logger = require("../utils/logger");
const ExportSQSHelper = require("../utils/ExportSQSHelper");
const sqsHelper = new ExportSQSHelper();

const getExports = async (filters = {}) => {
  try {
    const query = db("export_chats").select("*");

    if (filters.userId) query.where("user_id", filters.userId);
    if (filters.status) query.where("status", filters.status);
    if (filters.botId) query.where("bot_id", filters.botId);
    if (filters.clientPhone) query.where("client_phone", filters.clientPhone);
    if (filters.fromDate)
      query.where("created_at", ">=", new Date(filters.fromDate));
    if (filters.toDate)
      query.where("created_at", "<=", new Date(filters.toDate));

    if (filters.orderBy && filters.orderDirection)
      query.orderBy(filters.orderBy, filters.orderDirection);
    else query.orderBy("created_at", "DESC");

    if (filters.limit) query.limit(filters.limit);

    return query;
  } catch (error) {
    logger.error("Error in getExports:", error);
    throw new Error("Failed to fetch exports");
  }
};

const getExportByUUID = async (uuid) => {
  return db("export_chats").where("uuid_unique", uuid).first();
};

const createExportWithTransaction = async ({
  userId,
  botId,
  clientPhone,
  networkId,
  fromDate = null,
  toDate = null,
  includeMedia = false,
  isFullChat = false,
  exportUuid,
}) => {
  try {
    const bot = await repoBots.getBotsByField({ "bots.uuid_unique": botId });
    if (!bot.length) throw new Error("Bot not found");

    const contact = await repoContacts.getContactsByField({
      "social_contacts.contact_id": clientPhone,
    });
    if (!contact?.result || !contact.result.length)
      throw new Error("Client not found");

    const [existingActivation] = await repoBots.getBotSocialNetworkActivations({
      "bot_social_network_activations.bot_id": botId,
      "bot_social_network_activations.social_network_id": networkId,
    });

    if (!existingActivation) {
      throw new Error(
        `Activation for bot "${botId}" on network "${networkId}" not found.`
      );
    }

    const providerId = existingActivation.sn_provider_id;

    let createdExport;

    await db.transaction(async (trx) => {
      const [insertedId] = await trx("export_chats").insert({
        uuid_unique: exportUuid,
        user_id: userId,
        bot_id: botId,
        client_id: contact.result[0].uuid_unique,
        bot_phone: bot[0].identifier,
        client_phone: clientPhone,
        social_network_id: networkId,
        sn_provider_id: providerId,
        status: "QUEUE",
        from_date: fromDate,
        to_date: toDate,
        include_media: includeMedia,
        is_full_chat: isFullChat,
        created_at: new Date(),
        updated_at: new Date(),
      });

      createdExport = await trx("export_chats").where("id", insertedId).first();

      const sqsResult = await sqsHelper.sendCreateExportMessage({
        exportId: exportUuid,
        userId,
        botId,
        botPhone: bot[0].identifier,
        clientPhone,
        networkId,
        providerId,
        fromDate,
        toDate,
        includeMedia,
        isFullChat,
      });

      if (!sqsResult) throw new Error("Failed to send export to SQS");
    });

    return createdExport;
  } catch (error) {
    logger.error("Error in createExportWithTransaction:", error);
    throw new Error(error.message);
  }
};

const updateExportStatus = async (uuid, status) => {
  try {
    return db("export_chats")
      .where("uuid_unique", uuid)
      .update({ status, updated_at: new Date() });
  } catch (error) {
    logger.error("Error in updateExportStatus:", error);
    throw new Error("Failed to update export status");
  }
};

const countExportsLastHour = async (userId) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await db("export_chats")
      .where("user_id", userId)
      .andWhere("created_at", ">", oneHourAgo)
      .count("uuid_unique as count")
      .first();

    return result.count;
  } catch (error) {
    logger.error("Error in countExportsLastHour:", error);
    throw new Error("Failed to count exports");
  }
};

const cancelExportWithTransaction = async (uuid) => {
  try {
    let cancelledExport;

    await db.transaction(async (trx) => {
      const exportRow = await trx("export_chats")
        .where("uuid_unique", uuid)
        .first();

      if (!exportRow) throw new Error("Export not found");
      if (!["QUEUE", "PROCESSING"].includes(exportRow.status))
        throw new Error("Only exports in QUEUE or PROCESSING can be cancelled");

      await trx("export_chats")
        .where("uuid_unique", uuid)
        .update({ status: "CANCELLED", updated_at: new Date() });

      cancelledExport = await trx("export_chats")
        .where("uuid_unique", uuid)
        .first();

      const sqsCancel = await sqsHelper.sendCancelExportMessage(
        uuid,
        exportRow.user_id,
        "user_requested"
      );

      if (!sqsCancel) throw new Error("Failed to send cancellation to SQS");
    });

    return cancelledExport;
  } catch (error) {
    logger.error("Error in cancelExportWithTransaction:", error);
    throw new Error(error.message);
  }
};

module.exports = {
  getExports,
  getExportByUUID,
  createExportWithTransaction,
  updateExportStatus,
  countExportsLastHour,
  cancelExportWithTransaction,
};
