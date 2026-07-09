const Joi = require("joi");
const parsePhoneNumber = require("libphonenumber-js");

const modelPayments = require("../models/payments");

const processPaymentRequest = async (req, res) => {
  try {
    const params = Joi.object({
      companyID: Joi.string().required(),
      providerID: Joi.string().required(),
      accountCardID: Joi.string().optional().allow("", null),
      phoneNumber: Joi.string().optional().allow("", null),
    }).xor("accountCardID", "phoneNumber");

    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const schemaBody = Joi.object({
      amount: Joi.string().required(),
      transaction_type: Joi.string().required(),
      orderId: Joi.string().required(),
      currency: Joi.string().required(),
    });
    const { error: bodyError } = schemaBody.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelPayments.processPaymentRequest(
      req.query,
      req.body
    );

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

const generatePaymentToken = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().optional().allow("", null),
      botID: Joi.string().optional().allow("", null),
    }).xor("companyID", "botID");

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const schemaBody = Joi.object({
      phone: Joi.string().required(),
      amount: Joi.string().required(),
      currency: Joi.string().required(),
      transaction_type: Joi.string().required(),
    });
    const { error: errorBody } = schemaBody.validate(req.body);
    if (errorBody) {
      throw new Error(errorBody.details[0].message);
    }

    const response = await modelPayments.generatePaymentToken(
      req.query,
      req.body
    );

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

const getProviders = async (req, res) => {
  try {
    const params = Joi.object({
      companyID: Joi.string().required(),
      botID: Joi.string().required(),
    });
    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelPayments.getProviders(req.query);
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

const generatePaymentAuthCode = async (req, res) => {
  try {
    const querySchema = Joi.object({
      botID: Joi.string().required(),
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

    const { botID, phone } = req.query;

    const phoneNumber = parsePhoneNumber(`+${phone}`);
    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error("Invalid phone number");
    }

    const response = await modelPayments.createPaymentAuthCode({
      botID,
      phone,
    });

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

const verifyPaymentAuthCode = async (req, res) => {
  try {
    const querySchema = Joi.object({
      code: Joi.string().length(4).required(),
      phone: Joi.number()
        .min(10 ** 7)
        .max(10 ** 15 - 1)
        .required()
        .messages({
          "number.min": "Phone number should have at least 7 digits.",
          "number.max": "Phone number should have at most 15 digits.",
        }),
      accountCardID: Joi.string().required(),
      secret: Joi.string()
        .pattern(/^[0-9]{3,4}$/)
        .required()
        .messages({
          "string.pattern.base": "CVV must be 3 or 4 digits.",
        }),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { code, phone, accountCardID, secret } = req.query;

    const response = await modelPayments.updatePaymentAuthCodeStatus({
      code: code,
      phone: phone,
      accountCardID,
      secret,
    });

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

const getPaymentStatus = async (req, res) => {
  try {
    const queryParams = Joi.object({
      companyID: Joi.string().required(),
      botID: Joi.string().required(),
      referenceID: Joi.string().required(),
    });

    const { error: queryError } = queryParams.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelPayments.getPaymentStatus(req.query);

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
  processPaymentRequest,
  generatePaymentToken,
  getProviders,
  generatePaymentAuthCode,
  verifyPaymentAuthCode,
  getPaymentStatus,
};
