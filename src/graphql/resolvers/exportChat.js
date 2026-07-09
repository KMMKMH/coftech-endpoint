const repoExportChat = require("../../repositories/exportChat");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../utils/logger");
const allowedRoles = ["SUPERADMIN", "ADMIN"];

const createExportChat = async (parent, args, context) => {
  const { user, rolKey } = context;
  const {
    botId,
    clientPhone,
    networkId,
    isFullChat,
    fromDate,
    toDate,
    includeMedia,
  } = args.input;

  const exportUuid = uuidv4();

  try {
    if (!allowedRoles.includes(rolKey)) {
      throw new Error("You do not have permissions to create an export");
    }

    if (!networkId) {
      throw new Error("networkId is required");
    }

    if (isFullChat && (fromDate || toDate)) {
      throw new Error(
        "fromDate and toDate must be null when exporting full chat"
      );
    }
    if (!isFullChat && (!fromDate || !toDate)) {
      throw new Error(
        "fromDate and toDate are required when exporting partial chat"
      );
    }
    if (
      !isFullChat &&
      (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24) > 365
    ) {
      throw new Error("Date range cannot exceed 365 days");
    }

    const lastExports = await repoExportChat.countExportsLastHour(user);
    if (lastExports >= 5) {
      throw new Error("You have exceeded 5 exports per hour limit");
    }

    const createdExport = await repoExportChat.createExportWithTransaction({
      userId: user,
      botId,
      clientPhone,
      networkId,
      fromDate: fromDate || null,
      toDate: toDate || null,
      includeMedia,
      isFullChat,
      exportUuid,
    });

    logger.info(`Export created: ${exportUuid} by user ${user}`);
    return createdExport;
  } catch (error) {
    logger.error(`Error in createExportChat: ${exportUuid} - ${error.message}`);
    throw new Error(error.message);
  }
};

const cancelExportChat = async (parent, args, context) => {
  const { user, rolKey } = context;
  const { uuidUnique } = args;

  try {
    const exportRow = await repoExportChat.getExportByUUID(uuidUnique);
    if (!exportRow) throw new Error("Export not found");

    if (!allowedRoles.includes(rolKey) && exportRow.user_id !== user) {
      throw new Error("You do not have permission to cancel this export");
    }

    if (!["QUEUE", "PROCESSING"].includes(exportRow.status)) {
      throw new Error("Only exports in QUEUE or PROCESSING can be cancelled");
    }

    const cancelledExport = await repoExportChat.cancelExportWithTransaction(
      uuidUnique
    );
    logger.info(`Export cancelled: ${uuidUnique} by user ${user}`);
    return cancelledExport;
  } catch (error) {
    logger.error(`Error in cancelExportChat: ${uuidUnique} - ${error.message}`);
    throw new Error(error.message);
  }
};

const exportChats = async (parent, args, context) => {
  const { user, rolKey } = context;
  const {
    filters = args.filters || {},
    orderBy = args.orderBy || "created_at",
    orderDirection = args.orderDirection || "DESC",
    limit = args.limit || 50,
  } = args;

  try {
    const queryFilters = { ...filters, orderBy, orderDirection, limit };

    if (!allowedRoles.includes(rolKey)) {
      queryFilters.userId = user;
    }

    const results = await repoExportChat.getExports(queryFilters);

    return results;
  } catch (error) {
    logger.error(`Error in exportChats: user ${user} - ${error.message}`);
    throw new Error(error.message);
  }
};

module.exports = {
  createExportChat,
  cancelExportChat,
  exportChats,
};
