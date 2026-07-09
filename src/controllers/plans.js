const Joi = require("joi");

const plansModel = require("../models/plans");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const savePlans = async (req, res) => {
  const bodySchema = Joi.object({
    planName: Joi.string().min(3).max(25).required(),
    description: Joi.string().allow(null, "").max(500).optional(),
    price: Joi.number().min(0).max(99999999.99).precision(2).required(),
    isActive: Joi.boolean().default(true).strict().optional(),
    currencyID: Joi.string().guid({ version: "uuidv4" }).required(),
  });

  const valueBody = validateOrThrow(bodySchema, req.body);

  return res.status(200).json({
    code: 200,
    status: true,
    data: await plansModel.savePlans(valueBody),
    message: "Plan saved successfully",
  });
};

const listPlans = async (req, res) => {
  const paramsSchema = Joi.object({
    planName: Joi.string().min(3).max(25).optional(),
    isActive: Joi.boolean().strict().optional(),
    currencyID: Joi.string().guid({ version: "uuidv4" }).optional(),
  });

  if (req.query.isActive === "true") {
    req.query.isActive = true;
  } else if (req.query.isActive === "false") {
    req.query.isActive = false;
  }

  const valueQuery = validateOrThrow(paramsSchema, req.query);

  return res.status(200).json({
    code: 200,
    status: true,
    data: await plansModel.listPlans(valueQuery),
    message: "Plans retrieved successfully",
  });
};

const updatePlans = async (req, res) => {
  const bodySchema = Joi.object({
    planName: Joi.string().min(3).max(25).optional(),
    description: Joi.string().max(500).allow(null, "").optional(),
    price: Joi.number().min(0).max(99999999.99).precision(2).optional(),
    isActive: Joi.boolean().strict().optional(),
    currencyID: Joi.string().guid({ version: "uuidv4" }).optional(),
  });

  const paramsSchema = Joi.object({
    planID: Joi.string().guid({ version: "uuidv4" }).required(),
  });

  const valueBody = validateOrThrow(bodySchema, req.body);
  const valueParams = validateOrThrow(paramsSchema, req.query);

  await plansModel.updatePlans(valueParams.planID, valueBody);

  return res.status(200).json({
    code: 200,
    status: true,
    data: true,
    message: "Plan updated successfully",
  });
};

const deletePlans = async (req, res) => {
  const paramsSchema = Joi.object({
    planID: Joi.string().guid({ version: "uuidv4" }).required(),
  });
  const valueParams = validateOrThrow(paramsSchema, req.query);

  await plansModel.deletePlans(valueParams.planID);

  return res.status(200).json({
    code: 200,
    status: true,
    data: true,
    message: "Plan deleted successfully",
  });
};

const listPlansExtensions = async (req, res) => {
  const paramsSchema = Joi.object({
    planID: Joi.string().guid({ version: "uuidv4" }).optional(),
    extensionID: Joi.string().guid({ version: "uuidv4" }).optional(),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);

  return res.status(200).json({
    code: 200,
    status: true,
    data: await plansModel.listPlansExtensions(valueQuery),
    message: "Plan extensions retrieved successfully",
  });
};

const savePlansExtensions = async (req, res) => {
  const bodySchema = Joi.object({
    planID: Joi.string().guid({ version: "uuidv4" }).required(),
    extensionID: Joi.string().guid({ version: "uuidv4" }).required(),
  });

  const valueBody = validateOrThrow(bodySchema, req.body);

  return res.status(200).json({
    code: 200,
    status: true,
    data: await plansModel.savePlansExtensions(valueBody),
    message: "Plan extension saved successfully",
  });
};

const deletePlansExtensions = async (req, res) => {
  const paramsSchema = Joi.object({
    planID: Joi.string().guid({ version: "uuidv4" }).required(),
    extensionID: Joi.string().guid({ version: "uuidv4" }).required(),
  });

  const valueParams = validateOrThrow(paramsSchema, req.query);

  await plansModel.deletePlansExtensions(
    valueParams.planID,
    valueParams.extensionID
  );

  return res.status(200).json({
    code: 200,
    status: true,
    data: true,
    message: "Plan extension deleted successfully",
  });
};

module.exports = {
  savePlans,
  listPlans,
  updatePlans,
  deletePlans,
  listPlansExtensions,
  savePlansExtensions,
  deletePlansExtensions,
};
