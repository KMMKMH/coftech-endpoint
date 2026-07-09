const Joi = require("joi");
const dayjs = require("dayjs");

const modelAccounts = require("../models/accounts");
const modelAuth = require("../models/auth");
const repoAccounts = require("../repositories/accounts");
const repoAuth = require("../repositories/auth");
const repoCompany = require("../repositories/company");
const repoUtils = require("../repositories/utils");
const { repoDashLogs } = require("../repositories/dashboardLogs");

const { parsePhoneNumberFromString } = require("libphonenumber-js");
const generateToken = require("../utils/generateRandomToken");
const { generateJWT } = require("../utils/generateJWT");
const { generateRandomCode } = require("../utils/codeGenerator");
const { utilActionType, utilResourceType } = require("../utils/utilDashLogs");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const loginAccount = async (req, res) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      .required()
      .messages({
        "string.email": "Email must be valid",
        "string.pattern.base": "Email contains invalid characters",
        "any.required": "Email is required",
      }),
    password: Joi.string().required(),
  });

  validateOrThrow(schema, req.body);

  const { email, password } = req.body;
  const [emailField] = await repoAccounts.getAccountByField(
    {
      "accounts.email": email,
    },
    false
  );

  const passwordMatch = emailField
    ? await modelAccounts.verifyPassword(password, emailField.password)
    : false;

  if (!emailField || !passwordMatch) {
    throw ApiError(
      401,
      "Invalid email or password",
      ErrorCodes.AUTH_INVALID_CREDENTIALS
    );
  }

  const token = await generateJWT(
    "CoftechDashboard",
    {
      user: emailField.uuid_unique,
    },
    process.env.JWT_SECRET,
    { expiresIn: "3d" }
  );

  delete emailField.id;
  delete emailField.password;

  res.status(200).json({
    code: 200,
    status: true,
    data: {
      account: emailField,
      token,
    },
  });
};

const registerAccount = async (req, res) => {
  const { companyID } = req.query;
  let companyField;

  if (companyID) {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
    });

    validateOrThrow(paramsSchema, req.query);

    [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw ApiError(404, "Company not found", ErrorCodes.COMPANY_NOT_FOUND, {
        companyID,
      });
    }
  } else {
    const dataShop = req.body;
    req.body = {
      account_id: dataShop.ID,
      email: dataShop.user_email,
      registered_at: dataShop.user_registered,
      first_name: dataShop.first_name.value,
      last_name: dataShop.last_name.value,
      phone: dataShop.user_phone.value.toString(),
      password: dataShop.user_pass.value,
      photo: dataShop.photo,
      role_id: "",
    };
  }

  const schema = Joi.object({
    account_id: Joi.string().when("$query.companyID", {
      is: Joi.exist(),
      then: Joi.required(),
    }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      .required()
      .messages({
        "string.email": "Email must be valid",
        "string.pattern.base": "Email contains invalid characters",
        "any.required": "Email is required",
      }),
    registered_at: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    phone: Joi.string()
      .pattern(/^\+\d{10,15}$/)
      .required()
      .messages({
        "string.empty": "Phone is required",
        "string.pattern.base": "Phone must be a valid international format",
      }),
    password: Joi.string().required(),
    photo: Joi.string()
      .allow(null, "")
      .pattern(/^data:image\/[^;]+;base64,/)
      .custom((value, helpers) => {
        const base64String = value.split(",")[1];
        const { error } = Joi.string().base64().validate(base64String);
        if (error) {
          return helpers.message("Invalid base64");
        }
      }),
    role_id: Joi.string().allow(""),
  });

  validateOrThrow(schema, req.body);

  const phoneNumber = parsePhoneNumberFromString(req.body["phone"]);
  if (!phoneNumber || !phoneNumber.isValid()) {
    throw ApiError(
      400,
      "Phone must be a valid international format",
      ErrorCodes.VALIDATION_ERROR,
      {}
    );
  }

  req.body["phone"] = phoneNumber.number.replace(/\D/g, "");

  const response = await modelAccounts.createAccount({
    ...req.body,
    company_id: companyID,
  });

  res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const recoveryPassword = async (req, res) => {
  const schema = Joi.object({
    type: Joi.string().valid("email", "phone").required(),
    value: Joi.alternatives().conditional("type", {
      is: "email",
      then: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          "string.email": "Email must be valid",
        }),
      otherwise: Joi.string()
        .pattern(/^\+\d{10,15}$/)
        .required()
        .messages({
          "string.pattern.base": "Phone must be a valid international format",
        }),
    }),
  });

  const schemaValues = validateOrThrow(schema, req.body);

  if (schemaValues.type === "phone") {
    const phoneNumber = parsePhoneNumberFromString(schemaValues.value);
    if (!phoneNumber || !phoneNumber.isValid()) {
      throw ApiError(
        400,
        "Phone must be a valid international format",
        ErrorCodes.VALIDATION_ERROR,
        {}
      );
    }
    schemaValues.value = schemaValues.value.replace(/\D/g, "");
  }

  const { type, value } = schemaValues;
  const fieldType = `accounts.${type}`;

  const [accountField] = await repoAccounts.getAccountByField({
    [fieldType]: value,
  });

  if (accountField) {
    const { uuid_unique: accountId } = accountField;

    await modelAuth.checkBlockedStatus(accountId);
    await modelAuth.checkCooldown(accountId);
    await modelAuth.checkHourlyLimit(accountId);

    await repoAuth.expireAllActiveCodesForAccount(accountId);

    const code = generateRandomCode(6);
    const expiration_time = dayjs()
      .add(10, "minute")
      .format("YYYY-MM-DD HH:mm:ss");

    const codeData = await repoAuth.saveRecoveryCode({
      code,
      account_id: accountId,
      expiration_time,
    });

    const timeToExpire = 10;
    await modelAuth.sendRecoveryCode(type, value, codeData, timeToExpire);

    const data = await repoAuth.getAccountVerificationAttempts(accountId);
    await repoAuth.updateAccountVerificationAttempts(accountId, {
      hourly_requests_count: (data?.hourly_requests_count || 0) + 1,
      last_sent: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    });
  }

  res.status(200).json({
    code: 200,
    status: true,
    data: {
      message:
        "If an account with that email/phone exists, a recovery code has been sent.",
    },
  });
};

const verifyCode = async (req, res) => {
  const schema = Joi.object({
    type: Joi.string().valid("email", "phone").required(),
    value: Joi.alternatives().conditional("type", {
      is: "email",
      then: Joi.string().email().required(),
      otherwise: Joi.string()
        .pattern(/^\+?[0-9]\d{7,15}$/)
        .required()
        .messages({
          "string.pattern.base": "Phone must be a valid international format",
        }),
    }),
    code: Joi.string().required(),
  });

  const bodyValue = validateOrThrow(schema, req.body);

  if (bodyValue.type === "phone") {
    const phoneNumber = parsePhoneNumberFromString(bodyValue.value);
    if (!phoneNumber || !phoneNumber.isValid()) {
      throw ApiError(400, "Validation failed", ErrorCodes.VALIDATION_ERROR, {
        errors: [
          {
            field: "value",
            message: "Phone must be a valid international number",
            type: "phone.invalid",
          },
        ],
      });
    }
    bodyValue.value = bodyValue.value.replace(/\D/g, "");
  }

  const { code, type, value } = bodyValue;
  const fieldType = `accounts.${type}`;

  const [accountField] = await repoAccounts.getAccountByField({
    [fieldType]: value,
  });

  if (accountField) {
    await modelAuth.checkBlockedStatus(accountField.uuid_unique);
  }

  const codeField = accountField
    ? await repoAuth.getRecoveryCodeByField({
      "recovery_password.code": code,
      "recovery_password.account_id": accountField.uuid_unique,
    })
    : null;

  const isCodeInvalid =
    !codeField ||
    codeField.status !== "active" ||
    dayjs().isAfter(codeField.expiration_time);

  if (!accountField || isCodeInvalid) {
    if (accountField) {
      await modelAuth.incrementVerificationAttempts(accountField.uuid_unique);
      if (
        codeField &&
        codeField.status === "active" &&
        dayjs().isAfter(codeField.expiration_time)
      ) {
        await repoAuth.updateRecoveryCodeStatus(
          { "recovery_password.uuid_unique": codeField.uuid_unique },
          { status: "expired" }
        );
      }
    }
    throw ApiError(
      400,
      "Invalid or expired code",
      ErrorCodes.AUTH_CODE_NOT_FOUND,
      { code }
    );
  }

  await repoAuth.updateRecoveryCodeStatus(
    { "recovery_password.uuid_unique": codeField.uuid_unique },
    { status: "used" }
  );

  await repoAuth.updateAccountVerificationAttempts(accountField.uuid_unique, {
    verification_attempts: 0,
    blocked_until: null,
  });

  const token = await generateJWT(
    "CoftechDashboard",
    {
      user: accountField.uuid_unique,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  res.status(200).json({
    code: 200,
    status: true,
    data: {
      account: { user: accountField.uuid_unique, [type]: value },
      token,
    },
  });
};

const savePassword = async (req, res) => {
  const schema = Joi.object({
    password: Joi.string().required(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .optional(),
  });

  const { user } = req.unique_token;

  if (!user) {
    return res.status(401).json({
      code: 401,
      status: false,
      data: false,
      message: "Invalid token",
    });
  }

  validateOrThrow(schema, req.body);

  const { password, email } = req.body;

  const [accountField] = await repoAccounts.getAccountByField({
    "accounts.uuid_unique": user,
  });

  if (!accountField) {
    throw ApiError(404, "Account not found", ErrorCodes.ACCOUNT_NOT_FOUND, {
      user,
    });
  }

  const {
    company_id,
    first_name,
    last_name,
    uuid_unique: userID,
  } = accountField;

  if (email) {
    if (accountField.email !== email) {
      if (accountField.role_key !== "SUPERADMIN") {
        return res.status(403).json({
          code: 403,
          status: false,
          data: false,
          message: "Not authorized to change password",
        });
      }

      const [targetAccount] = await repoAccounts.getAccountByField({
        "accounts.email": email,
      });
      if (!targetAccount) {
        throw ApiError(
          404,
          "Account email not found",
          ErrorCodes.ACCOUNT_EMAIL_NOT_FOUND,
          { email }
        );
      }
      const hashedPassword = await modelAccounts.hashPassword(password);
      await repoAccounts.updateAccount(
        { "accounts.uuid_unique": targetAccount.uuid_unique },
        { password: hashedPassword }
      );

      const {
        company_id: targetCompanyID,
        first_name: targetFirstName,
        last_name: targetLastName,
        uuid_unique: targetUserID,
      } = targetAccount;

      const message = `User ${first_name} ${last_name} has changed ${targetFirstName} ${targetLastName} password.`;

      await repoDashLogs.save({
        user_id: user,
        action_type: utilActionType.Update,
        resource_type: utilResourceType.Account,
        company_id: targetCompanyID,
        name: `${targetFirstName} ${targetLastName}`,
        status: "success",
        metadata: {
          account: { userID: targetUserID },
          message: message,
        },
      });

      return res.status(200).json({
        code: 200,
        status: true,
      });
    }
  }

  const codeField = await repoAuth.getLatestValidRecoveryCode(userID);

  if (!codeField) {
    return res.status(403).json({
      code: 403,
      status: false,
      data: false,
      message:
        "There is no valid code used, please validate or generate a new one.",
    });
  }

  const hashedPassword = await modelAccounts.hashPassword(password);
  await repoAccounts.updateAccount(
    { "accounts.uuid_unique": user },
    { password: hashedPassword }
  );

  const message = `User ${first_name} ${last_name} has changed his password.`;

  await repoDashLogs.save({
    user_id: user,
    action_type: utilActionType.Update,
    resource_type: utilResourceType.Account,
    company_id: company_id,
    name: `${first_name} ${last_name}`,
    status: "success",
    metadata: {
      account: { userID },
      message: message,
    },
  });

  res.status(200).json({
    code: 200,
    status: true,
  });
};

const generateRandomToken = async (req, res) => {
  if (!Array.isArray(req.body) || req.body.length === 0) {
    return res.status(400).json({
      code: 400,
      status: false,
      data: false,
      message: "Allowed endpoints are required",
    });
  }

  const token = generateToken(16);
  const allowed_endpoints = req.body;

  const tokenData = {
    token,
    allowed_endpoints: JSON.stringify(allowed_endpoints),
  };

  const tokenField = await repoUtils.saveToken(tokenData);

  if (!tokenField) {
    throw ApiError(
      500,
      "Token generation failed",
      ErrorCodes.AUTH_TOKEN_GENERATION_FAILED,
      {}
    );
  }

  res.status(200).json({
    code: 200,
    status: true,
    data: tokenField,
  });
};

const updateToken = async (req, res) => {
  const querySchema = Joi.object({
    token: Joi.string().required(),
  });

  validateOrThrow(querySchema, req.query);

  const { token } = req.query;

  const tokenField = await repoUtils.getTokenByField({
    "tokens.token": token,
  });
  if (!tokenField) {
    throw ApiError(404, "Token not found", ErrorCodes.AUTH_TOKEN_NOT_FOUND, {});
  }

  const bodySchema = Joi.object({
    status: Joi.boolean().optional(),
    allowed_endpoints: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().required(),
          methods: Joi.array()
            .items(Joi.string().valid("GET", "POST", "PUT", "DELETE"))
            .required(),
        })
      )
      .optional(),
  });

  validateOrThrow(bodySchema, req.body);

  const data = req.body;
  const valuesToUpdate = {};

  if (data.status !== undefined && data.status !== tokenField.status) {
    valuesToUpdate.status = data.status;
  }
  if (data.allowed_endpoints !== undefined) {
    valuesToUpdate.allowed_endpoints = JSON.stringify(data.allowed_endpoints);
  }

  let response;
  if (Object.keys(valuesToUpdate).length > 0) {
    response = await repoUtils.updateToken(
      { "tokens.token": token },
      valuesToUpdate
    );
  }

  res.status(200).json({
    code: 200,
    status: true,
    data: response ? response : true,
  });
};

module.exports = {
  loginAccount,
  registerAccount,
  recoveryPassword,
  verifyCode,
  savePassword,
  generateRandomToken,
  updateToken,
};
