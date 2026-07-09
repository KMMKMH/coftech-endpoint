const repoBots = require("../repositories/bots");
const { repoBlacklist } = require("../repositories/blacklist");
const modelBots = require("../models/bots");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");

const saveBlacklist = async (query, body) => {
  const { botID } = query;

  const [botField] = await repoBots.getBotsByField({
    "bots.uuid_unique": botID,
  });

  if (!botField) {
    throw ApiError(
      404,
      `Bot with id ${botID} not found`,
      ErrorCodes.BOT_NOT_FOUND,
      { botID }
    );
  }

  const { company_id: companyID } = botField;
  const { phone } = body;

  const result = await repoBlacklist.save({
    company_id: companyID,
    bot_id: botID,
    phone,
  });

  await modelBots.sendBotBlacklist({ bot_id: botID });

  return result;
};

const deleteBlacklist = async (query, body) => {
  const { botID } = query;
  const { phone } = body;

  const [botField] = await repoBots.getBotsByField({
    "bots.uuid_unique": botID,
  });

  if (!botField) {
    throw ApiError(
      404,
      `Bot with id ${botID} not found`,
      ErrorCodes.BOT_NOT_FOUND,
      { botID }
    );
  }

  const [blacklistField] = await repoBlacklist.getByField({
    "blacklist.company_id": botField.company_id,
    "blacklist.bot_id": botID,
    "blacklist.phone": phone,
  });

  if (!blacklistField) {
    throw ApiError(
      404,
      "Blacklist entry not found",
      ErrorCodes.VALIDATION_ERROR,
      { query, phone }
    );
  }

  const result = await repoBlacklist.delete({
    "blacklist.uuid_unique": blacklistField.uuid_unique,
  });

  await modelBots.sendBotBlacklist({ bot_id: blacklistField.bot_id });

  return result;
};

const updateBlacklist = async (query, data) => {
  const { blacklistID } = query;

  const [blacklistField] = await repoBlacklist.getByField({
    "blacklist.uuid_unique": blacklistID,
  });

  if (!blacklistField) {
    throw ApiError(
      404,
      "Blacklist entry not found",
      ErrorCodes.VALIDATION_ERROR,
      { blacklistID }
    );
  }

  const dontUpdateFields = ["id", "uuid_unique", "created_at", "updated_at"];

  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key]) => !dontUpdateFields.includes(key))
  );

  if (Object.keys(filteredData).length === 0) {
    return false;
  }

  const where = {
    "blacklist.uuid_unique": blacklistID,
  };

  return await repoBlacklist.update(where, filteredData);
};

module.exports = {
  saveBlacklist,
  updateBlacklist,
  deleteBlacklist,
};