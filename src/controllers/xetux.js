const Joi = require("joi");
const dayjs = require("dayjs");

const modelXetux = require("../models/xetux");
const repoCompany = require("../repositories/company");
const repoBot = require("../repositories/bots");

const getSales = async (req, res) => {
  try {
    const params = Joi.object({
      companyID: Joi.string().required(),
      botID: Joi.string().required(),
      dateFrom: Joi.string().allow("", null),
      dateEnd: Joi.string().allow("", null),
    });

    const { error } = params.validate(req.query);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const { companyID, botID, dateFrom, dateEnd } = req.query;

    if(
      (dateFrom && !dateEnd) || (!dateFrom && dateEnd)
    ) {
      throw new Error("Date from and to are required together");
    }

    const from = dayjs(dateFrom);
    const to = dayjs(dateEnd);
    if (from.isAfter(to)) {
      throw new Error("Date from cannot be greater than date to");
    }

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [botField] = await repoBot.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Incorrect bot ID ${botID}.`);
    }

    const response = await modelXetux.getSales(req.query);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getPurchases = async (req, res) => {
  try {
    const params = Joi.object({
      companyID: Joi.string().required(),
      botID: Joi.string().required(),
      date: Joi.string().allow("", null),
    });

    const { error } = params.validate(req.query);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const { companyID, botID, date } = req.query;

    if(date) {
      const now = dayjs();
      if(dayjs(date).isAfter(now)) {
        throw new Error("Date cannot be greater than today");
      }
    }

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [botField] = await repoBot.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Incorrect bot ID ${botID}.`);
    }

    const response = await modelXetux.getPurchases(req.query);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

module.exports = {
  getSales,
  getPurchases,
};
