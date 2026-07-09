const bcrypt = require("bcrypt");

const modelCompany = require("../models/company");
const modelsBots = require("../models/bots");

const repoAccounts = require("../repositories/accounts");
const repoRoles = require("../repositories/roles");
const repoAuth = require("../repositories/auth");
const repoBots = require("../repositories/bots");

const { maskCardNumber } = require("../utils/maskCardNumber");
const { encrypt: cardEncrypt } = require("../utils/vaultCard");
const dayjs = require("dayjs");
const { createEventToDeleteCard } = require("../utils/createEventToDeleteCard");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");
const logger = require("../utils/logger");

const createAccount = async (data) => {
  try {
    const { role_id, company_id: companyID, phone } = data;
    let role_assigned = role_id
      ? { "roles.uuid_unique": role_id }
      : { "roles.key": "GUEST" };

    if (companyID) {
      data.account_id = Date.now();
    } else {
      role_assigned = { "roles.key": "ADMIN" };
    }

    const [roleField] = await repoRoles.getRoleByField(role_assigned);
    if (!roleField) {
      throw ApiError(400, "Invalid role ID", ErrorCodes.ROLE_INVALID, {
        role_id,
      });
    }

    const { email, account_id, password } = data;

    const [accountIDField] = await repoAccounts.getAccountByField({
      "accounts.id": account_id,
    });
    if (accountIDField) {
      throw ApiError(
        409,
        "Account already exists",
        ErrorCodes.ACCOUNT_ALREADY_EXISTS,
      );
    }

    const [accountPhoneField] = await repoAccounts.getAccountByField({
      "accounts.phone": phone,
    });

    if (accountPhoneField) {
      throw ApiError(
        409,
        "Phone number already registered",
        ErrorCodes.ACCOUNT_PHONE_ALREADY_EXISTS,
        { phone }
      );
    }

    const [accountEmailField] = await repoAccounts.getAccountByField({
      "accounts.email": email,
    });
    if (accountEmailField) {
      throw ApiError(
        409,
        "Email already registered",
        ErrorCodes.ACCOUNT_EMAIL_ALREADY_EXISTS,
        { email }
      );
    }

    if (!companyID) {
      const newCompanyField = await modelCompany.saveCompany({
        name: `Coftech Inc. ${Date.now()}`,
      });
      data.company_id = newCompanyField.uuid_unique;
    }

    data.id = data.account_id;
    data.password = await hashPassword(password);
    delete data.account_id;
    delete data.role_id;

    const { uuid_unique: id_account } = await repoAccounts.saveAccount(data);
    const { uuid_unique: id_role } = roleField;

    await repoRoles.saveAccountRole({ account_id: id_account, role_id: id_role });

    await handleAccountWhitelist({
      companyID: companyID || data.company_id,
      role_id: id_role,
      phone,
    });
  } catch (e) {
    logger.error(`Error creating account: ${JSON.stringify(e, null, 2)}`);
    if (e.code && e.statusCode) {
      throw e;
    }
    throw ApiError(
      500,
      "Failed to create account",
      ErrorCodes.ACCOUNT_CREATION_FAILED,
      null
    );
  }
};

const hashPassword = (password) => {
  return new Promise((resolve) => {
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(password, salt, function (err, hash) {
        resolve(hash);
      });
    });
  });
};

const verifyPassword = async (plain, hash) => {
  return await bcrypt.compare(plain, hash);
};

const verifyCode = async ({ code }) => {
  try {
    return await repoAuth.verifyCode(code);
  } catch {
    throw ApiError(
      500,
      "Failed to verify recovery code",
      ErrorCodes.AUTH_CODE_NOT_FOUND,
      { code }
    );
  }
};

const updateAccount = async ({ query, unique_token }, data) => {
  try {
    const { userID } = query;

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": userID,
    });
    if (!accountField) {
      throw ApiError(404, "Account not found", ErrorCodes.ACCOUNT_NOT_FOUND, {
        userID,
      });
    }

    if (data?.phone && accountField.phone != data.phone) {
      const [accountPhoneField] = await repoAccounts.getAccountByField({
        "accounts.phone": data.phone,
      });

      if (accountPhoneField) {
        throw ApiError(
          409,
          "Phone number already registered",
          ErrorCodes.ACCOUNT_PHONE_ALREADY_EXISTS,
          { phone: data.phone }
        );
      }
    }

    if (data?.email && accountField.email != data.email) {
      const [accountEmailField] = await repoAccounts.getAccountByField({
        "accounts.email": data.email,
      });

      if (accountEmailField) {
        throw ApiError(
          409,
          "Email already registered",
          ErrorCodes.ACCOUNT_EMAIL_ALREADY_EXISTS,
          { email: data.email }
        );
      }
    }


    if (data?.role_id && accountField.role_id != data.role_id) {
      const { user: userToken } = unique_token;
      const [myAccountByField] = await repoAccounts.getAccountByField({
        "accounts.uuid_unique": userToken,
      });

      const { role_key } = myAccountByField;
      const {
        role_key: accountRoleKey,
        company_id: companyID,
        phone,
      } = accountField;

      if (
        role_key == "SUPERADMIN" ||
        (role_key !== "SUPERADMIN" && accountRoleKey !== "SUPERADMIN")
      ) {
        await repoRoles.updateAccountRole(userID, data.role_id);
        await handleAccountWhitelist({
          companyID,
          role_id: data.role_id,
          prev_role_key: accountRoleKey,
          phone,
        });
      } else {
        throw ApiError(
          403,
          "Permission denied to update this account role",
          ErrorCodes.ACCOUNT_PERMISSION_DENIED,
          { userID }
        );
      }
    }

    delete data.role_id;

    const fieldsToUpdate = [
      "email",
      "first_name",
      "photo",
      "last_name",
      "status",
      "phone",
    ];

    let dataUpdate = {};

    fieldsToUpdate.forEach((field) => {
      if (data[field] != undefined && data[field] != accountField[field]) {
        dataUpdate[field] = data[field];
      }
    });

    if (Object.keys(dataUpdate).length > 0) {
      return await repoAccounts.updateAccount(
        { "accounts.uuid_unique": userID },
        dataUpdate
      );
    } else {
      return true;
    }
  } catch (error) {
    if (error.code && error.statusCode) {
      throw error;
    }
    throw ApiError(
      500,
      "Failed to update account",
      ErrorCodes.ACCOUNT_UPDATE_FAILED,
      null
    );
  }
};

const handleSuperAdminWhitelist = async (botsField, data) => {
  const { phone, role_key, prev_role_key } = data;
  if (role_key === "SUPERADMIN") {
    await modelsBots.sendBotWhitelist(null, { phone }, true);
  } else if (prev_role_key === "SUPERADMIN") {
    if (role_key === "ADMIN") {
      await modelsBots.sendBotWhitelist(null, { phone, remove: true }, true);
      handleAdminWhitelist(botsField, data);
    } else {
      await modelsBots.sendBotWhitelist(null, { phone, remove: true }, true);
    }
  }
};

const handleAdminWhitelist = async (botsField, data) => {
  for (const bot of botsField) {
    const { phone, role_key, prev_role_key } = data;
    const { uuid_unique: bot_id } = bot;

    if (role_key === "ADMIN") {
      await modelsBots.sendBotWhitelist({ bot_id }, { phone });
    } else if (prev_role_key === "ADMIN") {
      await modelsBots.sendBotWhitelist({ bot_id }, { phone, remove: true });
    }
  }
};

const handleAccountWhitelist = async (data) => {
  try {
    const { companyID, role_id, phone, prev_role_key } = data;
    const botsField = await repoBots.getBotsByField({
      "bots.company_id": companyID,
    });

    if (botsField.length === 0) {
      return;
    }

    const [roleField] = await repoRoles.getRoleByField({
      "roles.uuid_unique": role_id,
    });
    const { key: role_key } = roleField;

    if (role_key === "SUPERADMIN" || prev_role_key === "SUPERADMIN") {
      handleSuperAdminWhitelist(botsField, { phone, role_key, prev_role_key });
    } else if (role_key === "ADMIN" || prev_role_key === "ADMIN") {
      handleAdminWhitelist(botsField, { phone, role_key, prev_role_key });
    }
  } catch (error) {
    if (error.code && error.statusCode) {
      throw error;
    }
    throw ApiError(
      500,
      "Failed to handle account whitelist",
      ErrorCodes.INTERNAL_SERVER_ERROR,
      null
    );
  }
};

const saveAccountCard = async (body) => {
  try {
    const { email, ccnumber, ccexp, cvv, phone } = body;

    const ccexpFormated = `${ccexp.slice(0, 2)}/${ccexp.slice(2)}`;
    const ccexpToDate = dayjs(ccexpFormated, "MM/YY");
    const isValidDate = ccexpToDate.isValid();

    if (!isValidDate) {
      throw ApiError(
        400,
        "Invalid expiration date. Must be in MM/YY format",
        ErrorCodes.ACCOUNT_CARD_INVALID_EXPIRATION,
        { ccexp }
      );
    } else if (
      ccexpToDate.isBefore(dayjs(), "month") &&
      !ccexpToDate.isSame(dayjs(), "month")
    ) {
      throw ApiError(
        400,
        "Card expiration date is in the past",
        ErrorCodes.ACCOUNT_CARD_EXPIRED,
        { ccexp }
      );
    }

    const cardEncrypted = cardEncrypt(`${ccexp}` + `${ccnumber}`, cvv);
    const phoneNumberFormatted = phone?.replace(/\D/g, "");

    const [existingAccountCard] = await repoAccounts.getAccountCardByField({
      "accounts_cards.phone": phoneNumberFormatted,
      "accounts_cards.customer_vault_id": cardEncrypted,
    });

    if (existingAccountCard) {
      throw ApiError(
        409,
        "Card already exists",
        ErrorCodes.ACCOUNT_CARD_ALREADY_EXISTS,
        { phone: phoneNumberFormatted }
      );
    }

    const cardIdMasked = maskCardNumber(ccnumber);

    const accountCardData = {
      "accounts_cards.email": email ? email : null,
      "accounts_cards.customer_vault_id": cardEncrypted,
      "accounts_cards.card_id": cardIdMasked,
      "accounts_cards.phone": phoneNumberFormatted,
    };
    const response = await repoAccounts.saveAccountCard(accountCardData);
    await createEventToDeleteCard(response, ccexpToDate);
    return response;
  } catch (error) {
    if (error.code && error.statusCode) {
      throw error;
    }
    throw ApiError(
      500,
      "Failed to save account card",
      ErrorCodes.ACCOUNT_CARD_CREATION_FAILED,
      null
    );
  }
};

const deleteAccountCard = async (query) => {
  try {
    const { accountCardID } = query;

    const [accountCardField] = await repoAccounts.getAccountCardByField({
      "accounts_cards.uuid_unique": accountCardID,
    });

    if (!accountCardField) {
      throw ApiError(
        404,
        "Account card not found",
        ErrorCodes.ACCOUNT_CARD_NOT_FOUND,
        { accountCardID }
      );
    }

    return await repoAccounts.deleteAccountCard({
      "accounts_cards.uuid_unique": accountCardID,
    });
  } catch (error) {
    if (error.code && error.statusCode) {
      throw error;
    }
    throw ApiError(
      500,
      "Failed to delete account card",
      ErrorCodes.ACCOUNT_CARD_DELETION_FAILED,
      { accountCardID: query.accountCardID }
    );
  }
};

const getAccountCardList = async (query) => {
  try {
    const { phoneNumber } = query;
    const phoneNumberFormatted = phoneNumber?.replace(/\D/g, "");

    const response = await repoAccounts.getAccountCardByField({
      "accounts_cards.phone": phoneNumberFormatted,
    });

    response.forEach((accountCard) => {
      delete accountCard.id;
      delete accountCard.customer_vault_id;
    });

    return response;
  } catch (error) {
    if (error.code && error.statusCode) {
      throw error;
    }
    throw ApiError(
      500,
      "Failed to get account card list",
      ErrorCodes.INTERNAL_SERVER_ERROR,
      null
    );
  }
};

module.exports = {
  createAccount,
  hashPassword,
  verifyPassword,
  verifyCode,
  updateAccount,
  saveAccountCard,
  deleteAccountCard,
  getAccountCardList,
};
