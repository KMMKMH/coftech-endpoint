const Joi = require("joi");
const url = require("url");

const repoGoogle = require("../repositories/google");
const modelsGoogle = require("../models/google");
const logger = require("../utils/logger")

const generateAuthUrl = async (req, res) => {
  try {
    const querySchema = Joi.object({
      googleScopeID: Joi.string().required(),
      botID: Joi.string().optional().allow("", null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const urlResponse = await modelsGoogle.generateAuthUrl(req.query);

    res.status(200).json({
      code: 200,
      status: true,
      data: urlResponse,
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

const googleAuth = async (req, res) => {
  try {
    const querySchema = Joi.object({
      code: Joi.string(),
      scope: Joi.string(),
      error: Joi.string(),
      state: Joi.string(),
    });

    const queryParsed = url.parse(req.url, true).query;

    const { error: queryError } = querySchema.validate(queryParsed);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    await modelsGoogle.googleAuth(queryParsed);

    const successUrl = process.env.GOOGLE_AUTH_SUCCESS_URL || '/auth/success';
    res.redirect(successUrl);
  } catch (error) {
    logger.error(`[GoogleAuth] Error: ${JSON.stringify(error, null, 2)}`);
    const failureUrl = process.env.GOOGLE_AUTH_FAILURE_URL || '/auth/failed';
    res.redirect(failureUrl);
  }
};

const revokeAuth = async (req, res) => {
  try {
    const querySchema = Joi.object({
      botID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelsGoogle.revokeAuth(req.query);

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

const getScopes = async (req, res) => {
  try {
    const querySchema = Joi.object({
      serviceName: Joi.string().optional().allow("", null),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }
    const { serviceName } = req.query;

    const data = serviceName
      ? { "google_scopes.key": serviceName.toUpperCase() }
      : {};

    const response = await repoGoogle.getScopesByField(data);

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

const getAuthState = async (req,res) => {
  try {
    const querySchema = Joi.object({
      botID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelsGoogle.getAuthState(req.query);
    
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

module.exports = { generateAuthUrl, googleAuth, getScopes, revokeAuth, getAuthState };
