const Joi = require("joi");
const modelBotMaker = require("../models/botMaker");
const requestBotMaker = require("../utils/requestBotMaker");

const getChannels = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID } = req.query;

    const token = await modelBotMaker.validateCompanyAndToken(companyID);

    const data = {
      url: "/channels",
      method: "GET",
      token: token,
    };

    const response = await requestBotMaker(data);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getWhatsappTemplates = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      state: Joi.string().optional().allow("APPROVED", "REJECTED"),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID, state } = req.query;

    const token = await modelBotMaker.validateCompanyAndToken(companyID);

    const data = {
      url: state ? `/whatsapp/templates?state=${state}` : "/whatsapp/templates",
      method: "GET",
      token: token,
    };

    const response = await requestBotMaker(data);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getVariableList = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      onlyTags: Joi.boolean().optional(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID, onlyTags } = req.query;

    const token = await modelBotMaker.validateCompanyAndToken(companyID);

    const data = {
      url:
        onlyTags === "true" || onlyTags === "false"
          ? `/variables?onlyTags=${onlyTags}`
          : "/variables",
      method: "GET",
      token: token,
    };
    const response = await requestBotMaker(data);

    res.status(200).json({
      code: 200,
      status: true,
      data: response === "" ? "No Content" : response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getIntentList = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      idOrName: Joi.string().optional().allow(null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID, idOrName } = req.query;

    const token = await modelBotMaker.validateCompanyAndToken(companyID);

    const data = {
      url: idOrName ? `/intents/${idOrName}` : "/intents",
      method: "GET",
      token: token,
    };
    const response = await requestBotMaker(data);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const sendTriggerIntent = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      channelId: Joi.string().required(),
      contactId: Joi.string().required(),
      intentIdOrName: Joi.string().required(),
      variables: Joi.object().optional().allow(null),
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelBotMaker.sendTriggerIntent(req.query, req.body);

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
  getChannels,
  getWhatsappTemplates,
  getVariableList,
  sendTriggerIntent,
  getIntentList,
};
