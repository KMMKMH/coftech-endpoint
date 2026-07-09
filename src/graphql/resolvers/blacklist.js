const Joi = require("joi");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const repoCompany = require("../../repositories/company");
const repoBots = require("../../repositories/bots");
const { repoBlacklist } = require("../../repositories/blacklist");
const modelBlacklist = require("../../models/blacklist");
const logger = require("../../utils/logger");

const getBlacklist = async (parent, args) => {
  try {
    const { companyID, botID, phone, type } = args;

    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      botID: Joi.string().uuid({ version: "uuidv4" }).allow(null, ""),
      phone: Joi.string().allow(null, ""),
      type: Joi.string().allow(null, "").valid("CLIENT", "BOT"),
    });

    const { error: queryError } = querySchema.validate(args);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company not found`);
    }

    let findParams = {
      "blacklist.company_id": companyID,
    };

    if (botID) {
      const [botField] = await repoBots.getBotsByField({
        "bots.company_id": companyID,
        "bots.uuid_unique": botID,
      });
      if (!botField) {
        throw new Error(`Bot not found`);
      }
      findParams["blacklist.bot_id"] = botID;
    }

    if (phone) {
      const phoneNumber = parsePhoneNumberFromString(
        phone.startsWith("+") ? phone : `+${phone}`
      );
      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error("Invalid phone number");
      }
      findParams["blacklist.phone"] = phoneNumber.format("E.164").replace("+", "");
    }

    if (type) {
      findParams["blacklist.type"] = type;
    }

    const response = await repoBlacklist.getByField(findParams);
    return response;
  } catch (error) {
    logger.error(`Error in getBlacklist: ${error.message}`);
    throw new Error(error.message);
  }
};

const createBlacklist = async (parent, args) => {
  try {
    const { botID, phone } = args;

    const schema = Joi.object({
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      phone: Joi.string().required(),
    });

    const { error } = schema.validate(args);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error("Bot not found");
    }

    const phoneNumber = parsePhoneNumberFromString(
      phone.startsWith("+") ? phone : `+${phone}`
    );
    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error("Invalid phone number format. It must be in E.164 format.");
    }

    const formattedPhone = phoneNumber.format("E.164").replace("+", "");

    const [existing] = await repoBlacklist.getByField({
      "blacklist.bot_id": botID,
      "blacklist.phone": formattedPhone,
    });

    if (existing) {
      throw new Error("Phone number already exists in blacklist");
    }

    return await modelBlacklist.saveBlacklist({ botID }, { phone: formattedPhone });
  } catch (error) {
    logger.error(`Error in createBlacklist: ${error.message}`);
    throw new Error(error.message);
  }
};

const deleteBlacklist = async (parent, args) => {
  try {
    const { botID, phone } = args;

    const schema = Joi.object({
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      phone: Joi.string().required(),
    });

    const { error } = schema.validate(args);
    if (error) {
      throw new Error(error.details[0].message);
    }
    
    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error("Bot not found");
    }

    const phoneNumber = parsePhoneNumberFromString(
      phone.startsWith("+") ? phone : `+${phone}`
    );
    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error("Invalid phone number format. It must be in E.164 format.");
    }

    const formattedPhone = phoneNumber.format("E.164").replace("+", "");

    const [blacklistField] = await repoBlacklist.getByField({
      "blacklist.bot_id": botID,
      "blacklist.phone": formattedPhone,
    });

    if (!blacklistField) {
      throw new Error("Phone number not found in blacklist");
    }

    await modelBlacklist.deleteBlacklist({ botID }, { phone: formattedPhone });
    return true;
  } catch (error) {
    logger.error(`Error in deleteBlacklist: ${error.message}`);
    throw new Error(error.message);
  }
};

module.exports = {
  getBlacklist,
  createBlacklist,
  deleteBlacklist,
};
