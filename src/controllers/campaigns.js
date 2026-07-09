const Joi = require("joi");
const parsePhoneNumber = require("libphonenumber-js");

const modelCampaigns = require("../models/campaigns");

const getCampaigns = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCampaigns.getCampaigns(req.query);

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

const createCampaign = async (req, res) => {
  try {
    const querySchema = Joi.object({
      botID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
      type: Joi.string().required(),
      cron: Joi.string().required(),
      source: Joi.string().required(),
      message: Joi.string().allow("", null),
      media: Joi.string().allow("", null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }
    
    const { message, media } = req.body;
    if(!message && !media) {
      throw new Error("Message or media is required.");
    }

    const response = await modelCampaigns.createCampaign(req.query, req.body);

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

const updateCampaign = async (req, res) => {
  try {
    const querySchema = Joi.object({
      campaignID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().allow("", null),
      type: Joi.string().allow("", null),
      cron: Joi.string().allow("", null),
      source: Joi.string().allow("", null),
      status: Joi.string().valid("ACTIVE", "STOPPED", "CANCELLED").allow("", null),
      message: Joi.string().allow("", null),
      media: Joi.string().allow("", null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCampaigns.updateCampaign(req.query, req.body);

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

const updateCampaignConfigs = async (req, res) => {
  try {
    const querySchema = Joi.object({
      campaignID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.array().items(
      Joi.object({
        key: Joi.string().required(),
        data: Joi.string().required(),
      })
    ).required();

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCampaigns.updateCampaignConfigs(req.query, { configs: req.body });

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

const continueStoppedCampaign = async (req, res) => {
  try {
    const querySchema = Joi.object({
      campaignID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCampaigns.continueCampaign(req.query);

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
}

const stopInProgressCampaign = async (req, res) => {
  try {
    const querySchema = Joi.object({
      campaignID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCampaigns.stopCampaign(req.query);

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
}

const testCampaign = async (req, res) => {
  try {
    const querySchema = Joi.object({
      campaignID: Joi.string().required(),
      phone: Joi.number()
        .min(10 ** 7)
        .max(10 ** 15 - 1)
        .required()
        .messages({
          "number.min": "Phone number should have at least 7 digits.",
          "number.max": "Phone number should have at most 15 digits.",
        }),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { phone } = req.query;

    const phoneNumber = parsePhoneNumber(`+${phone}`);
    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error("Invalid phone number");
    }

    const response = await modelCampaigns.testCampaign(req.query);

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
}

module.exports = {
  getCampaigns,
  createCampaign,
  updateCampaign,
  updateCampaignConfigs,
  continueStoppedCampaign,
  stopInProgressCampaign,
  testCampaign,
};