const Joi = require("joi");
const repoUtils = require("../repositories/utils");
const modelUtils = require("../models/utils");
const repoAccount = require("../repositories/accounts");
const repoExtension = require("../repositories/extensions");
const repoCompany = require("../repositories/company");
const { emitNotification } = require("../utils/socket/notifications");

const listCurrencies = async (req, res) => {
  try {
    const querySchema = Joi.object({
      currencyID: Joi.string().allow(null).optional(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { currencyID } = req.query;
    const data = {
      ...(currencyID && { "currencies.uuid_unique": currencyID }),
    };

    const response = await repoUtils.getCurrenciesByField(data);

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

const listCountries = async (req, res) => {
  try {
    const querySchema = Joi.object({
      countryID: Joi.string().allow(null),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { countryID } = req.query;
    const data = {
      ...(countryID && { "countries.uuid_unique": countryID }),
    };

    const response = await repoUtils.getCountriesByField(data);

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

const listPeriodOfDays = async (req, res) => {
  try {
    const querySchema = Joi.object({
      languageCode: Joi.string().allow(null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { languageCode } = req.query;

    let response = await repoUtils.getUtilsByField(
      {
        "utils.key": "PERIOD_OF_DAY",
      },
      false,
      languageCode
        ? `JSON_EXTRACT(data, "$[*].names.${languageCode}") as periods`
        : ""
    );

    const periods = response[0]?.periods ? response[0].periods : null;
    if (languageCode && !Boolean.call(null, periods)) {
      throw new Error(
        `No period found for the given language code ${languageCode}`
      );
    }

    res.status(200).json({
      code: 200,
      status: true,
      data: periods ? periods : response,
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

const listDaysOfWeek = async (req, res) => {
  try {
    const querySchema = Joi.object({
      languageCode: Joi.string().allow(null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { languageCode } = req.query;

    let response = await repoUtils.getUtilsByField(
      {
        "utils.key": "DAYS_OF_WEEK",
      },
      false,
      languageCode
        ? `JSON_EXTRACT(data, "$[*].names.${languageCode}") as days, JSON_EXTRACT(data, "$[*].order") as orders`
        : ""
    );

    const days = response[0]?.days ? response[0].days : null;
    if (languageCode && !days) {
      throw new Error(
        `No days found for the given language code ${languageCode}`
      );
    }

    if (languageCode && days) {
      const orders = response[0]?.orders || [];
      response = days.map((day, index) => ({
        day: day,
        order: orders[index],
      }));
    }

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

const getAllEndpoints = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      endpoint: Joi.string().allow("", null),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { user } = req.unique_token;
    const { endpoint } = req.query;

    const [accountField] = await repoAccount.getAccountByField({
      "accounts.uuid_unique": user,
    });

    if (!accountField) {
      throw new Error(`User with UUID '${user}' not found.`);
    }

    const { company_id } = accountField;

    const extensionDetailsResults = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": company_id,
      "configs_templates.owner_type": "extension",
    });

    const extensions_id = extensionDetailsResults.map(
      (ext) => ext.template_extension_id
    );

    const unique_extensions = [...new Set(extensions_id)];

    const extensionsDetails = await repoExtension.getExtensionByField({
      "extensions.uuid_unique": unique_extensions,
    });

    const extensionsKeys = extensionsDetails.map((extension) => extension.key);

    const filteredRoutes = await modelUtils.getEndpointsByField(
      endpoint,
      extensionsKeys
    );

    return res.status(200).json({
      code: 200,
      status: true,
      data: {
        filteredRoutes,
      },
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

const createAndStoreEmbedding = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      fileID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      text: Joi.string().required(),
      chunknumber: Joi.number().integer().min(1).required(),
      extraMetadata: Joi.object().optional(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelUtils.createAndStoreEmbedding(
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

const createNotification = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      roomID: Joi.string().uuid({ version: "uuidv4" }).required(),
      event: Joi.string()
        .valid("INFO", "WARNING", "ERROR", "SUCCESS", "CANCELLED", "CUSTOM")
        .required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);

    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { roomID, event } = req.query;

    const bodySchema = Joi.object({
      message: Joi.string().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);

    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { message } = req.body;

    const response = emitNotification(roomID, event, message);

    if (!response) {
      throw new Error("Failed to create notification");
    }

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

const listActionTypes = async (req, res) => {
  try {
    const querySchema = Joi.object({
      languageCode: Joi.string().valid("en", "es", "zh").default("en"),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { languageCode } = req.query;

    let response = await repoUtils.getUtilsByField(
      {
        "utils.key": "ACTION_TYPE",
      },
      false,
      languageCode
        ? `JSON_EXTRACT(data, "$[*].key") as keyValues, JSON_EXTRACT(data, "$[*].names.${languageCode}") as texts`
        : ""
    );

    const texts = response[0]?.texts ? response[0].texts : null;
    if (languageCode && !texts) {
      throw new Error(
        `No record found for the given language code ${languageCode}`
      );
    }

    if (languageCode && texts) {
      const keyValues = response[0]?.keyValues || [];
      response = texts.map((item, index) => ({
        text: item,
        value: keyValues[index],
      }));
    }

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

const listResourceTypes = async (req, res) => {
  try {
    const querySchema = Joi.object({
      languageCode: Joi.string().valid("en", "es", "zh").default("en"),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { languageCode } = req.query;

    let response = await repoUtils.getUtilsByField(
      {
        "utils.key": "RESOURCE_TYPE",
      },
      false,
      languageCode
        ? `JSON_EXTRACT(data, "$[*].key") as keyValues, JSON_EXTRACT(data, "$[*].names.${languageCode}") as texts`
        : ""
    );

    const texts = response[0]?.texts ? response[0].texts : null;
    if (languageCode && !texts) {
      throw new Error(
        `No record found for the given language code ${languageCode}`
      );
    }

    if (languageCode && texts) {
      const keyValues = response[0]?.keyValues || [];
      response = texts.map((text, index) => ({
        text: text,
        value: keyValues[index],
      }));
    }

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
  listCurrencies,
  listCountries,
  listPeriodOfDays,
  listDaysOfWeek,
  getAllEndpoints,
  createAndStoreEmbedding,
  createNotification,
  listActionTypes,
  listResourceTypes,
};
