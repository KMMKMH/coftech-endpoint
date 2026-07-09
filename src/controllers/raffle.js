const Joi = require("joi");

const modelRaffle = require("../models/raffle");
const repoCompany = require("../repositories/company");
const repoRaffle = require("../repositories/raffle");
const repoUtils = require("../repositories/utils");

const verifyRaffleUser = async (req, res) => {
  try {
    const querySchema = Joi.object({
      botID: Joi.string().optional().allow(null),
      companyID: Joi.string().optional().allow(null),
    }).xor("botID", "companyID");

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchemas = [
      {
        companyID: Joi.object({
          channelId: Joi.string().required(),
          contactId: Joi.string()
            .custom((value) => {
              if (value.startsWith("+")) {
                value = value.slice(1);
              }
              return value;
            })
            .required(),
          items: Joi.array()
            .items(
              Joi.object({
                intentIdOrName: Joi.string().required(),
                variables: Joi.object().optional().allow(null),
              })
            )
            .min(1)
            .required(),
        }).required(),
      },
      {
        botID: Joi.object({
          phone: Joi.string()
            .custom((value) => {
              if (value.startsWith("+")) {
                value = value.slice(1);
              }
              return value;
            })
            .pattern(/^[1-9]\d{9,14}$/)
            .required()
            .messages({
              "string.base": "Phone number must be a text string.",
              "string.empty": "Phone number cannot be empty.",
              "string.pattern.base":
                "Phone number must contain only digits and be between 10 and 15 characters long.",
              "any.required": "Phone number is required.",
            }),
        }),
      },
    ];

    const queryKey = req.query.botID ? "botID" : "companyID";
    const validSchema = bodySchemas.some((schema) => {
      const schemaToValidate = schema[queryKey];
      if (schemaToValidate) {
        return !schemaToValidate.validate(req.body).error;
      }
    });

    if (!validSchema) {
      throw new Error(`Invalid body schema for ${queryKey}.`);
    }

    const response = await modelRaffle.verifyRaffleUser(
      req.body,
      req.query
    );

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

const verifyUserWithCode = async (req, res) => {
  try {
    const schema = Joi.object({
      code: Joi.string().required(),
      phone: Joi.string()
        .custom((value) => {
          if (value.startsWith("+")) {
            value = value.slice(1);
          }
          return value;
        })
        .pattern(/^[1-9]\d{9,14}$/)
        .required()
        .messages({
          "string.base": "Phone number must be a text string.",
          "string.empty": "Phone number cannot be empty.",
          "string.pattern.base":
            "Phone number must contain only digits and be between 10 and 15 characters long.",
          "any.required": "Phone number is required.",
        }),
    });

    const { code, phone } = req.body;

    const { error } = schema.validate(req.body);

    if (error) {
      throw new Error(error.details[0].message);
    }

    const response = await modelRaffle.verifyUserWithCode(code, phone);

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

const updateUserInfo = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      key: Joi.string().required(),
      phone: Joi.string()
        .custom((value) => {
          if (value.startsWith("+")) {
            value = value.slice(1);
          }
          return value;
        })
        .pattern(/^[1-9]\d{9,14}$/)
        .allow(null, "")
        .messages({
          "string.base": "Phone number must be a text string.",
          "string.empty": "Phone number cannot be empty.",
          "string.pattern.base":
            "Phone number must contain only digits and be between 10 and 15 characters long.",
          "any.required": "Phone number is required.",
        }),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object().unknown(true);

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { KEY } = req.query;

    if (KEY === "USER_DATA_PROFILE") {
      const { phone } = req.query;
      if (!phone) {
        throw new Error("Phone number is required!.");
      }
    }

    const response = await modelRaffle.updateUserInfo(req.query, req.body);

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

const verifyInvoice = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
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

    const dynamicBodySchema = Joi.object({
      invoice: Joi.string()
        .pattern(/^((?!data:image\/\*;base64,).)*$/)
        .required(),
    }).unknown(true);

    const { error: bodyError } = dynamicBodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    modelRaffle.verifyInvoice(req.query, req.body);

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

const getCompanyConfig = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }
    const response = await modelRaffle.getCompanyData(companyID);

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

const saveCompanyConfig = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      key: Joi.string().required(),
      data: Joi.any().required(),
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
      throw new Error(`Incorrect company ID ${companyID}.`);
    }
    const response = await modelRaffle.saveCompanyData(companyID, req.body);

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

const updateCompanyConfig = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      key: Joi.string().required(),
      data: Joi.any().required(),
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
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const { key, data } = req.body;

    const response = await repoRaffle.updateCompanyConfig(
      {
        "raffle_company_configs.company_id": companyID,
        "raffle_company_configs.key": key,
      },
      { "raffle_company_configs.data": data }
    );

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

const setCompanyConfigs = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID } = req.query;

    const response = await modelRaffle.setCompanyConfigs(companyID);

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

const getInvoices = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      invoiceID: Joi.string().optional().allow(null),
      phone: Joi.number()
        .min(10 ** 7)
        .max(10 ** 15 - 1)
        .optional()
        .allow(null)
        .messages({
          "number.min": "Phone number should have at least 7 digits.",
          "number.max": "Phone number should have at most 15 digits.",
        }),
    }).oxor("invoiceID", "phone");

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelRaffle.getInvoices(req.query);

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

const saveLottery = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      lottery_type_ID: Joi.string().required(),
      start_date: Joi.string().required(),
      end_date: Joi.string().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelRaffle.saveLottery(req.query, req.body);

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

const getLottery = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      lotteryID: Joi.string().optional().allow(null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID, lotteryID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const lotteryField = await repoRaffle.getLotteryByField({
      ...(lotteryID && { "raffle_lottery.uuid_unique": lotteryID }),
      "raffle_lottery.company_id": companyID,
    });

    if (!lotteryField.length) {
      throw new Error(
        `Not found lottery ${
          lotteryID ? `ID ${lotteryID}` : `for company ID ${companyID}`
        }.`
      );
    }

    const response = lotteryField.map((lottery) => {
      delete lottery.id;
      return lottery;
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

const getLotteryConfigs = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      lotteryID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID, lotteryID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [lotteryConfigsField] = await repoRaffle.getLotteryConfigsByField({
      "raffle_lottery_configs.lottery_id": lotteryID,
    });

    if (!lotteryConfigsField) {
      throw new Error(`Incorrect lottery ID ${lotteryID}.`);
    }

    res.status(200).json({
      code: 200,
      status: true,
      data: lotteryConfigsField,
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

const saveLotteryConfig = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      lotteryID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      key: Joi.string().required(),
      data: Joi.any().required(),
      description: Joi.string().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { companyID, lotteryID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [lotteryField] = await repoRaffle.getLotteryByField({
      "raffle_lottery.uuid_unique": lotteryID,
      "raffle_lottery.company_id": companyID,
    });

    if (!lotteryField) {
      throw new Error(`Incorrect lottery ID ${lotteryID}.`);
    }
    const response = await modelRaffle.saveLotteryConfig(
      req.query,
      req.body
    );

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

const updateLotteryConfigs = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      lotteryID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      key: Joi.string(),
      data: Joi.any(),
      description: Joi.string(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { companyID, lotteryID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [lotteryField] = await repoRaffle.getLotteryByField({
      "raffle_lottery.uuid_unique": lotteryID,
      "raffle_lottery.company_id": companyID,
    });

    if (!lotteryField) {
      throw new Error(`Incorrect lottery ID ${lotteryID}.`);
    }

    const response = await modelRaffle.updateLotteryConfigs(
      req.query,
      req.body
    );

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

const updateLottery = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      lotteryID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      key: Joi.string().required(),
      data: Joi.any().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { companyID, lotteryID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [lotteryField] = await repoRaffle.getLotteryByField({
      "raffle_lottery.uuid_unique": lotteryID,
      "raffle_lottery.company_id": companyID,
    });

    if (!lotteryField) {
      throw new Error(`Incorrect lottery ID ${lotteryID}.`);
    }

    const response = await modelRaffle.updateLottery(req.query, req.body);

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

const deleteLottery = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      lotteryID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID, lotteryID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [lotteryField] = await repoRaffle.getLotteryByField({
      "raffle_lottery.uuid_unique": lotteryID,
      "raffle_lottery.company_id": companyID,
    });

    if (!lotteryField) {
      throw new Error(`Incorrect lottery ID ${lotteryID}.`);
    }

    const response = await modelRaffle.deleteLottery(req.query);

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

const getUsers = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      key: Joi.string().required(),
      phone: Joi.string()
        .custom((value) => {
          if (value.startsWith("+")) {
            value = value.slice(1);
          }
          return value;
        })
        .pattern(/^[1-9]\d{9,14}$/)
        .allow(null, "")
        .messages({
          "string.base": "Phone number must be a text string.",
          "string.empty": "Phone number cannot be empty.",
          "string.pattern.base":
            "Phone number must contain only digits and be between 10 and 15 characters long.",
          "any.required": "Phone number is required.",
        }),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID, key, phone } = req.query;

    let response;

    if (key == "USER_DATA_PROFILE_INVOICES") {
      response = await repoUtils.customQuery(
        `
          SELECT
            raffle_logs.reference,
            raffle_logs.data AS user_data,
            raffle_logs.created_at AS user_created_at,
            raffle_invoices.uuid_unique AS invoice_id,
            raffle_invoices.reference,
            raffle_invoices.points,
            raffle_invoices.created_at AS invoice_created_at,
            raffle_invoices.updated_at AS invoice_updated_at,
            raffle_invoices.metadata AS invoice_metadata
          FROM raffle_logs
          INNER JOIN raffle_users ON raffle_logs.reference = raffle_users.phone
          INNER JOIN raffle_invoices ON raffle_users.uuid_unique = raffle_invoices.user_id
          AND raffle_invoices.company_id = ?
          WHERE raffle_logs.company_id = ?
          AND raffle_logs.key= 'USER_DATA_PROFILE'
        `,
        [companyID, companyID]
      );
    } else {
      response = await repoRaffle.getInfoLogsByField({
        "raffle_logs.company_id": companyID,
        "raffle_logs.key": key,
        ...(phone && { "raffle_logs.reference": phone }),
      });
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

const updateInvoice = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      invoiceID: Joi.string().required(),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      reference: Joi.boolean().required(),
      points: Joi.number().required(),
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelRaffle.updateInvoice(req.query, req.body);

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

const saveRole = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      key: Joi.string().required(),
      name: Joi.string().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await repoRaffle.saveRole(req.body);

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

const getRoles = async (req, res) => {
  try {
    const response = await repoRaffle.getRoles();

    if (!response) {
      throw new Error("error getting rolees");
    }

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

const deleteRole = async (req, res) => {
  try {
    const querySchema = Joi.object({
      roleID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { roleID } = req.query;

    const [roleField] = await repoRaffle.getRoleByField({
      "raffle_roles.uuid_unique": roleID,
    });
    if (!roleField) {
      throw new Error(`Incorrect role ID ${roleID}.`);
    }

    const response = await modelRaffle.deleteRole(req.query);

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

const updateRole = async (req, res) => {
  try {
    const querySchema = Joi.object({
      rolID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      key: Joi.string().required(),
      data: Joi.any().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { rolID } = req.query;

    const [roleField] = await repoRaffle.getRoleByField({
      "raffle_roles.uuid_unique": rolID,
    });

    if (!roleField) {
      throw new Error(`Incorrect role ID ${rolID}.`);
    }

    const response = await modelRaffle.updateRole(req.query, req.body);

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

const getUserRoles = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      userID: Joi.string().optional().allow(null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID, userID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const userRolesField = await repoRaffle.getUserRolesByField({
      ...(userID && { "raffle_user_roles.user_id": userID }),
      "raffle_user_roles.company_id": companyID,
    });

    if (!userRolesField.length) {
      throw new Error(
        `Not found user role ${
          userID ? `ID ${userID}` : `for company ID ${companyID}`
        }.`
      );
    }

    const response = userRolesField.map((users) => {
      delete users.id;
      return users;
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

const saveUserRole = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      userID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID, userID } = req.query;

    const [userRoleField] = await repoRaffle.getUserRolesByField({
      "raffle_user_roles.user_id": userID,
      "raffle_user_roles.company_id": companyID,
    });

    if (!userRoleField) {
      throw new Error(`Incorrect user ID ${userID}.`);
    }

    const bodySchema = Joi.object({
      roleID: Joi.string().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelRaffle.saveUserRole(req.query, req.body);

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

const updateUserRole = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      userID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      role_id: Joi.string().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { companyID, userID } = req.query;

    const [userRoleField] = await repoRaffle.getUserRolesByField({
      "raffle_user_roles.company_id": companyID,
      "raffle_user_roles.user_id": userID,
    });

    if (!userRoleField) {
      throw new Error(`Incorrect user ID ${userID}.`);
    }

    const { role_id } = req.body;

    const [roleField] = await repoRaffle.getRoleByField({
      "raffle_roles.uuid_unique": role_id,
    });

    if (!roleField) {
      throw new Error(`Incorrect role ID ${role_id}.`);
    }

    const response = await modelRaffle.updateUserRole(req.query, req.body);

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

const deleteUserRole = async (req, res) => {
  try {
    const querySchema = Joi.object({
      userID: Joi.string().required(),
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { companyID, userID } = req.query;

    const [userRoleField] = await repoRaffle.getUserRolesByField({
      "raffle_user_roles.company_id": companyID,
      "raffle_user_roles.user_id": userID,
    });

    if (!userRoleField) {
      throw new Error(`Incorrect user ID ${userID}.`);
    }

    const response = await modelRaffle.deleteUserRole(req.query);

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

const getLotteryWinner = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelRaffle.getLotteryWinner(req.query);

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
  verifyUserWithCode,
  verifyRaffleUser,
  updateUserInfo,
  verifyInvoice,
  getCompanyConfig,
  saveCompanyConfig,
  updateCompanyConfig,
  setCompanyConfigs,
  getInvoices,
  getUsers,
  saveLottery,
  updateLottery,
  getLottery,
  deleteLottery,
  getLotteryConfigs,
  saveLotteryConfig,
  updateLotteryConfigs,
  updateInvoice,
  saveRole,
  getRoles,
  deleteRole,
  updateRole,
  getUserRoles,
  saveUserRole,
  updateUserRole,
  deleteUserRole,
  getLotteryWinner,
};
