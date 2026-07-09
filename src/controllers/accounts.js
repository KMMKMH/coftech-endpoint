const Joi = require("joi");

const modelAccounts = require("../models/accounts");
const repoAccounts = require("../repositories/accounts");
const repoCompany = require("../repositories/company");
const { repoDashLogs } = require("../repositories/dashboardLogs");
const { generateChangesMetadata } = require("../utils/generateChangesMetadata");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const { utilActionType, utilResourceType } = require("../utils/utilDashLogs");

const getAccountList = async (req, res) => {
  try {
    const { companyID, userID } = req.query;

    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      userID: Joi.string().allow(""),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const { user } = req.unique_token;
    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    const { role_key, company_id } = accountField;
    if (role_key !== "SUPERADMIN") {
      if (company_id != companyID) {
        throw new Error(`Incorrect company ID ${companyID}.`);
      }
    }

    const findParams = {
      ...{ "accounts.company_id": companyID },
      ...(userID && { "accounts.uuid_unique": userID }),
    };

    const response = await repoAccounts.getAccountByField(findParams);

    const sanitizedResults = response.map((result) => {
      const { ...sanitizedResult } = result;
      return sanitizedResult;
    });

    res.status(200).json({
      code: 200,
      status: true,
      data: sanitizedResults.length > 0 ? sanitizedResults : [],
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

const updateAccount = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      userID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      first_name: Joi.string(),
      last_name: Joi.string(),
      status: Joi.boolean(),
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
      photo: Joi.string()
        .pattern(/^data:image\/[^;]+;base64,/)
        .custom((value, helpers) => {
          const base64String = value.split(",")[1];
          const { error } = Joi.string().base64().validate(base64String);
          if (error) {
            return helpers.message("Invalid base64 string");
          }
        })
        .allow(""),
      role_id: Joi.string(),
      phone: Joi.string()
        .pattern(/^\+?[0-9\s-]{7,15}$/)
        .messages({
          "string.pattern.base":
            "Phone number must be a valid international number.",
        }),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const [oldAccount] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": req.query.userID,
    });
    if (!oldAccount) {
      throw new Error(`Account with userID: ${req.query.userID} not found.`);
    }

    const { first_name, last_name } = oldAccount;

    const relevantKeys = [
      "first_name",
      "last_name",
      "status",
      "email",
      "photo",
      "role_id",
      "phone",
    ];
    const oldValues = {};
    const newValues = {};

    const phoneNumber = parsePhoneNumberFromString(req.body["phone"]);
    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error("Phone number must be a valid international number.");
    }

    req.body["phone"] = phoneNumber.number.replace(/\D/g, "");

    for (const key of relevantKeys) {
      if (key in req.body) {
        oldValues[key] = oldAccount[key];
        newValues[key] = req.body[key];
      }
    }

    const changes = generateChangesMetadata(oldValues, newValues);

    const response = await modelAccounts.updateAccount(
      { query: req.query, unique_token: req.unique_token },
      req.body
    );

    const { company_id, uuid_unique: userID } = oldAccount;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Update,
      resource_type: utilResourceType.Account,
      company_id,
      name: `${first_name} ${last_name}`,
      status: "success",
      metadata: {
        changes,
        account: {
          userID,
        },
      },
    });

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

const deleteAccount = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      userID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { companyID, userID } = req.query;
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": userID,
      "accounts.company_id": companyID,
    });

    if (!accountField) {
      throw new Error(`Incorrect account ID ${userID}.`);
    }

    const { first_name, last_name } = accountField;

    await repoAccounts.deleteAccountRole({
      "account_role.role_id": accountField.role_id,
      "account_role.account_id": userID,
    });

    const response = await repoAccounts.deleteAccount({
      "accounts.uuid_unique": userID,
      "accounts.company_id": companyID,
    });

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Delete,
      resource_type: utilResourceType.Account,
      company_id: companyID,
      name: `${first_name} ${last_name}`,
      status: "success",
      metadata: { account: { userID } },
    });

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

const saveCards = async (req, res) => {
  try {
    const schemaBody = Joi.object({
      ccnumber: Joi.string()
        .pattern(/^[0-9]{13,19}$/)
        .required()
        .messages({
          "string.pattern.base":
            "Credit card number must be between 13 and 19 digits.",
        }),
      ccexp: Joi.string()
        .pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)
        .required()
        .messages({
          "string.pattern.base": "Expiration date must be in MMYY format.",
        }),
      cvv: Joi.string()
        .pattern(/^[0-9]{3,4}$/)
        .required()
        .messages({
          "string.pattern.base": "CVV must be 3 or 4 digits.",
        }),
      phone: Joi.string()
        .pattern(/^\+?[0-9\s-]{7,15}$/)
        .required()
        .messages({
          "string.pattern.base":
            "Phone number must be a valid international number.",
        }),
      email: Joi.string().email().optional().allow(""),
    });

    const { error: bodyError } = schemaBody.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError);
    }

    const response = await modelAccounts.saveAccountCard(req.body);

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

const deleteCards = async (req, res) => {
  try {
    const params = Joi.object({
      accountCardID: Joi.string().required(),
    });

    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError);
    }

    const response = await modelAccounts.deleteAccountCard(req.query);

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

const getAccountCardList = async (req, res) => {
  try {
    const params = Joi.object({
      phoneNumber: Joi.string()
        .pattern(/^\+?[0-9\s-]{7,15}$/)
        .messages({
          "string.pattern.base":
            "Phone number must be a valid international number.",
        }),
    });

    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError);
    }

    const response = await modelAccounts.getAccountCardList(req.query);

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
  getAccountList,
  updateAccount,
  deleteAccount,
  saveCards,
  deleteCards,
  getAccountCardList,
};
