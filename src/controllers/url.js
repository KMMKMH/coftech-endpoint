const Joi = require("joi");
const modelUrl = require("../models/url");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const saveUrl = async (req, res) => {
  const paramsSchema = Joi.object({
    companyID: Joi.string().required(),
  });

  const query = validateOrThrow(paramsSchema, req.query);

  const bodySchema = Joi.object({
    url: Joi.string().required(),
    time: Joi.number(),
    attempts: Joi.number(),
  });

  const body = validateOrThrow(bodySchema, req.body);

  const response = await modelUrl.saveUrl(query, body);

  res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const getUrl = async (req, res) => {
  const paramsSchema = Joi.object({
    key: Joi.string().required(),
  });

  const query = validateOrThrow(paramsSchema, req.query);

  const response = await modelUrl.getUrl(query);

  res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const listUrl = async (req, res) => {
  const paramsSchema = Joi.object({
    companyID: Joi.string().required(),
  });

  const query = validateOrThrow(paramsSchema, req.query);

  const response = await modelUrl.listUrl(query);

  res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

module.exports = {
  saveUrl,
  listUrl,
  getUrl,
};
