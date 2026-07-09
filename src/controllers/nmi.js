const Joi = require("joi");
const parsePhoneNumber = require("libphonenumber-js");

const modelNMI = require("../models/nmi");

const getCustomerTransactionalData = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      customerVaultId: Joi.string().allow(null, ""),
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
    }).allow(null, "");

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    if (!req.query.email && !req.query.customerVaultId) {
      throw new Error("Email or customerVaultId is required");
    }

    const response = await modelNMI.getTransactionalData(req.query);

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

const getPlanSubscription = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      customerVaultId: Joi.string().allow(null, ""),
      phone: Joi.number().min(10**7).max(10**15 - 1).messages({
        'number.min': 'Phone number should have at least 7 digits.',
        'number.max': 'Phone number should have at most 15 digits.'
      }).allow(null, ""),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { customerVaultId, phone } = req.query;

    if (!customerVaultId && !phone) {
      throw new Error("customerVaultId or phone is required");
    }

    if (phone) {
      const phoneNumber = parsePhoneNumber(`+${phone}`);
      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error("Invalid phone number");
      }
    }

    const response = await modelNMI.getPlanSubscription(req.query);

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

const listPlanSubscriptions = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelNMI.listPlanSubscriptions(req.query);

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

const createPlanSubscription = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      customerVaultId: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      currency: Joi.string().required(),
      plan_payments: Joi.number().required(),
      plan_amount: Joi.number().min(0.1).required(),
      day_of_month: Joi.number().min(1).allow(null, ""),
      day_frequency: Joi.number().allow(null, ""),
      month_frequency: Joi.number().allow(null, ""),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { day_frequency, month_frequency, day_of_month } = req.body;

    if (!day_frequency && !day_of_month && !month_frequency) {
      throw new Error(
        "day_frequency or day_of_month and month_frequency are required"
      );
    }

    if (day_frequency && (day_of_month || month_frequency)) {
      throw new Error(
        "day_frequency and day_of_month or month_frequency can't exist together"
      );
    }

    if (
      (day_of_month && !month_frequency) ||
      (!day_of_month && month_frequency)
    ) {
      throw new Error("day_of_month and month_frequency are required together");
    }

    const response = await modelNMI.createSubscription(req.query, req.body);

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

module.exports = {
  getCustomerTransactionalData,
  getPlanSubscription,
  listPlanSubscriptions,
  createPlanSubscription,
};
