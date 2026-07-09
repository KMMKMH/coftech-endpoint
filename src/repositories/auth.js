const db = require("../utils/db");
const logger = require("../utils/logger");
const saveRecoveryCode = async (data) => {
  try {
    logger.info(`Saving recovery code with data: ${JSON.stringify(data)}`);

    const recoveryId = await db("recovery_password").insert(data);

    const response = await getRecoveryCodeByField({
      "recovery_password.id": recoveryId[0],
    });

    logger.info(`saveRecoveryCode response data: ${JSON.stringify(response)}`);

    return response;
  } catch (e) {
    logger.error(
      `Error saving recovery code with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving recovery code`);
  }
};

const getRecoveryCodeByField = async (data) => {
  try {
    const query = db("recovery_password").where(data);
    const result = await query;
    return result.length > 0 ? result[0] : null;
  } catch (e) {
    logger.error(
      `Error getting recovery code with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting recovery code`);
  }
};

const getLatestValidRecoveryCode = async (accountId) => {
  try {
    const result = await db("recovery_password")
      .where({
        account_id: accountId,
        status: "used",
      })
      .where("expiration_time", ">=", new Date())
      .orderBy("created_at", "desc")
      .first();

    return result || null;
  } catch (e) {
    logger.error(
      `Error getting latest valid recovery code for account_id: ${accountId}, error: ${JSON.stringify(
        e
      )}`
    );
    throw new Error("Error getting latest valid recovery code");
  }
};

const updateRecoveryCodeStatus = async (where, data) => {
  try {
    logger.info(
      `Updating recovery code where ${JSON.stringify(
        where
      )}, with data ${JSON.stringify(data)}`
    );
    await db("recovery_password").where(where).update(data);
  } catch (e) {
    logger.error(
      `Error updating recovery code where ${where}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating recovery code status`);
  }
};

const getAccountVerificationAttempts = async (accountId) => {
  try {
    const result = await db("account_verification_attempts")
      .where({ "account_verification_attempts.account_id": accountId })
      .first();
    return result || null;
  } catch (error) {
    logger.error(`Error getting verification attempts: ${error.message}`);
    throw new Error(`Error getting verification attempts`);
  }
};

const updateAccountVerificationAttempts = async (accountId, data) => {
  try {
    const exists = await getAccountVerificationAttempts(accountId);

    if (exists) {
      await db("account_verification_attempts")
        .where({ "account_verification_attempts.account_id": accountId })
        .update(data);
    } else {
      await db("account_verification_attempts").insert({
        account_id: accountId,
        ...data,
      });
    }
  } catch (error) {
    logger.error(`Error updating verification attempts: ${error.message}`);
    throw new Error(`Error updating verification attempts`);
  }
};

const expireAllActiveCodesForAccount = async (accountId) => {
  try {
    await db("recovery_password")
      .where({ "recovery_password.account_id": accountId, status: "active" })
      .update({ status: "expired" });
  } catch (error) {
    logger.error(`Error expiring active codes: ${error.message}`);
    throw new Error(`Error expiring active codes`);
  }
};

module.exports = {
  saveRecoveryCode,
  getRecoveryCodeByField,
  getLatestValidRecoveryCode,
  updateRecoveryCodeStatus,
  getAccountVerificationAttempts,
  updateAccountVerificationAttempts,
  expireAllActiveCodesForAccount,
};
