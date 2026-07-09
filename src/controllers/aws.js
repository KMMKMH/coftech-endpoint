require("dotenv").config();
const Joi = require("joi");

const modelAWS = require("../models/aws");
const repoAWS = require("../repositories/aws");

const listMachines = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      instanceName: Joi.string(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { instanceName } = req.query;
    const response = await repoAWS.awsGetInstance({ instanceName });

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const listBotsPerMachine = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      instanceID: Joi.string(),
      botID: Joi.string(),
      instanceName: Joi.string(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { instanceID, botID, instanceName } = req.query;
    const query = {};

    if (botID) {
      query["aws_instances_bots.bot_id"] = botID;
    } else if (instanceID) {
      query["aws_instances_bots.instance_id"] = instanceID;
    } else if (instanceName) {
      query["aws_instances.name"] = instanceName;
    }

    const response = await repoAWS.getInstanceBotsByField(query);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const putInstancePorts = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      instanceID: Joi.string(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      ports: Joi.array().items(Joi.string()).default([]).required(),
    });

    const { params: bodyError } = bodySchema.validate(req.query);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    if (typeof req.body.ports == "string") {
      req.body.ports = JSON.parse(req.body.ports);
    }

    const { ports } = req.body;
    const { instanceID } = req.query;

    const [instanceField] = await repoAWS.getInstanceByField({
      "aws_instances.uuid_unique": instanceID,
    });
    if (!instanceField) {
      throw new Error(`Instance ${instanceID} not found.`);
    }

    const response = await repoAWS.awsPutPorts(instanceField.name, ports);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const createMachine = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      bundleId: Joi.string(),
      companyID: Joi.string().uuid().optional(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { bundleId, companyID } = req.query;

    const response = await modelAWS.createMachine(bundleId, companyID);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const deleteMachine = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      instanceName: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { instanceName } = req.query;

    const response = await modelAWS.deleteMachine(instanceName);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const instanceReady = async (req, res) => {
  try {
    const bodyParams = Joi.object({
      instanceName: Joi.string(),
    });

    const { error: bodyError } = bodyParams.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { instanceName } = req.body;

    if (!instanceName) {
      return res.send();
    }

    const response = await modelAWS.instanceReady(instanceName);

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

const updateBotInstance = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      botID: Joi.string().uuid().required(),
    });
    const { error: paramsError, value: paramValue } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      instanceID: Joi.string().uuid().required(),
    });
    const { error: bodyError, value: bodyValue} = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { botID } = paramValue;
    const { instanceID } = bodyValue;

    await modelAWS.updateBotInstance(instanceID, botID);

    res.status(200).json({
      code: 200,
      status: true,
      data: true,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const restartInstance = async (req, res) => {
  try {
    const queryParams = Joi.object({
      instanceID: Joi.string().guid({ version: "uuidv4" }).required(),
    });

    const { error: queryError, value: queryValues } = queryParams.validate(
      req.query
    );
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { instanceID } = queryValues;

    const [instanceField] = await repoAWS.getInstanceByField({
      "aws_instances.uuid_unique": instanceID,
    });

    if (!instanceField) {
      throw new Error(`Instance ID ${instanceID} not found`);
    }

    const { name: instanceName } = instanceField;

    const response = await repoAWS.restartInstance(instanceName);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

module.exports = {
  createMachine,
  listBotsPerMachine,
  listMachines,
  updateBotInstance,
  putInstancePorts,
  deleteMachine,
  instanceReady,
  restartInstance,
};
