const Joi = require("joi");

const modelCompany = require("../models/company");
const repoCompany = require("../repositories/company");
const repoAccounts = require("../repositories/accounts");
const repoBots = require("../repositories/bots");
const { repoDashLogs } = require("../repositories/dashboardLogs");
const { generateChangesMetadata } = require("../utils/generateChangesMetadata");
const { utilResourceType, utilActionType } = require("../utils/utilDashLogs");

const getCompanyList = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().allow(null, ""),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelCompany.getCompanyList({
      ...req.query,
      ...req.unique_token,
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

const createCompany = async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const response = await modelCompany.saveCompany(req.body);

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

const updateCompany = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string(),
      status: Joi.boolean(),
      logo: Joi.string()
        .pattern(/^data:image\/[^;]+;base64,/)
        .custom((value, helpers) => {
          const base64String = value.split(",")[1];
          const { error } = Joi.string().base64().validate(base64String);
          if (error) {
            return helpers.message("Invalid base64 string");
          }
        })
        .allow(""),
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { companyID } = req.query;
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company: ${companyID} not found.`);
    }

    const response = await modelCompany.updateCompany(companyID, req.body, {
      userToken: req.unique_token,
    });

    const { name } = companyField;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Update,
      resource_type: utilResourceType.company,
      name: name,
      status: "success",
      company_id: companyID,
      metadata: {
        changes: generateChangesMetadata(companyField, req.body),
        company: {
          companyID,
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

const listCoreConfigs = async (req, res) => {
  try {
    const { user } = req.unique_token;
    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    const { role_key } = accountField;

    if (role_key !== "SUPERADMIN") {
      throw new Error("Company configs access denied.");
    }

    const paramsSchema = Joi.object({
      configKey: Joi.string(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { configKey } = req.query;
    const query = {};

    if (configKey) {
      query.key = configKey;
    }

    const response = await repoCompany.getCoreConfigsByField(query);

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

const getCompanyConfigs = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      ownerType: Joi.string().required(),
      botID: Joi.string().uuid({ version: "uuidv4" }).optional().allow(null),
      sn_providerID: Joi.string()
        .uuid({ version: "uuidv4" })
        .optional()
        .allow(null),
    })
      .custom((value, helpers) => {
        if (value.ownerType === "provider" && !value.botID) {
          return helpers.error("any.custom", {
            message: "bot is required when the owner configs is 'provider'",
          });
        }
        return value;
      })
      .messages({ "any.custom": "{{#message}}" });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) throw new Error(paramsError.details[0].message);

    const { companyID, ownerType, botID, sn_providerID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) throw new Error(`Company: ${companyID} not found.`);

    let botField = null;
    if (botID) {
      [botField] = await repoBots.getBotsByField({
        "bots.uuid_unique": botID,
        "bots.company_id": companyID,
      });
      if (!botField) {
        throw new Error(`Bot: ${botID} not found for company: ${companyID}.`);
      }
    }

    const response = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      ...(botID && { "company_configs.bot_id": botID }),
      ...(sn_providerID && {
        "configs_templates.sn_provider_id": sn_providerID,
      }),
      "configs_templates.owner_type": ownerType,
    });

    const META_PROVIDER_KEY = "meta";
    const WEBHOOK_TEMPLATE_KEY = "WHATSAPP_WEBHOOK_URL";

    if (
      ownerType === "provider" &&
      botField?.provider_key === META_PROVIDER_KEY
    ) {
      const webhookUrl = `https://${
        process.env?.WHATSAPP_WEBHOOK_URL || "coftech-backend-meta.coftechservices.com"
      }/webhooks/meta/${botID}`;

      const nowSql = new Date().toISOString();

      response.push({
        uuid_unique: crypto.randomUUID(),
        company_id: companyID,
        bot_id: botID,
        config_template_id: null,
        data: webhookUrl,
        created_at: nowSql,
        updated_at: nowSql,
        template_key: WEBHOOK_TEMPLATE_KEY,
        template_data_type: "string",
        template_data_options: null,
        template_extension_id: null,
        template_sn_provider_id: botField?.provider_id,
        template_owner_type: "provider",
        template_description:
          "WhatsApp Webhook URL endpoint for receiving messages and events",
        template_internal: 1,
        extension_category_name: null,
        extension_category_dynamic: null,
      });
    }

    response.forEach((config) => {
      delete config.id;
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

const updateCompanyConfigs = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      extensionID: Joi.string().uuid({ version: "uuidv4" }),
      sn_providerID: Joi.string().uuid({ version: "uuidv4" }),
      botID: Joi.string()
        .uuid({ version: "uuidv4" })
        .when(Joi.ref("extensionID"), {
          is: Joi.exist(),
          then: Joi.required(),
          otherwise: Joi.when(Joi.ref("sn_providerID"), {
            is: Joi.exist(),
            then: Joi.required(),
            otherwise: Joi.optional(),
          }),
        }),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      key: Joi.string(),
      data: Joi.string().allow("", null),
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { user } = req.unique_token;

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    if (!accountField) {
      throw new Error("Token error, invalid information");
    }

    const { first_name, last_name } = accountField;
    const fullName = `${first_name} ${last_name}`;
    req.body.updated_by = fullName;

    const response = await modelCompany.updateCompanyConfigs(
      req.query,
      req.body
    );

    const { companyID } = req.query;
    const { name } = accountField;

    await repoDashLogs.save({
      user_id: user,
      action_type: utilActionType.Update,
      resource_type: utilResourceType.CompanyConfig,
      name: name,
      status: "success",
      company_id: companyID,
      metadata: {
        ...req.body,
        company: {
          companyID,
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

module.exports = {
  getCompanyList,
  createCompany,
  updateCompany,
  listCoreConfigs,
  updateCompanyConfigs,
  getCompanyConfigs,
};
