const repoAuth = require("../repositories/auth");
const modelsBots = require("../models/bots");
const dayjs = require("dayjs");
const logger = require("../utils/logger");
const emailService = require("../utils/email/emailService");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");

const sendWACode = async (whatsapp, code, timeToExpire) => {
  try {
    const message = `Your password recovery code is: *${code}*. \nPlease note that your code will expire in *${timeToExpire}* minutes.`;

    return await modelsBots.sendMessageAsBot(whatsapp, message);
  } catch (error) {
    logger.error(`Error sending code Whatsapp ${error}`);
    throw ApiError(500, 'Failed to send WhatsApp recovery code', ErrorCodes.AUTH_WHATSAPP_SEND_FAILED, { whatsapp });
  }
};

const sendEmailCode = async (email, code, timeToExpire) => {
  try {
    logger.info(`Sending email with data ${(email, code, timeToExpire)}`);

    const emailData = {
      title: "Password Recovery",
      code,
      timeToExpire,
    };

    await emailService.sendTemplateEmail(
      email,
      "recoveryCode",
      emailData,
      "Password Recovery"
    );
  } catch (error) {
    logger.error(`Error sending code Email ${error}`);
    throw ApiError(500, 'Failed to send email recovery code', ErrorCodes.AUTH_EMAIL_SEND_FAILED, { email });
  }
};

const sendRecoveryCode = async (type, value, codeData, timeToExpire) => {
  try {
    const { code } = codeData;

    if (type === "phone") {
      await sendWACode(value, code, timeToExpire);
    } else if (type === "email") {
      await sendEmailCode(value, code, timeToExpire);
    }

    return true;
  } catch (err) {
    logger.error("Recovery code error:", err);
    throw err;
  }
};

const createRecoveryCode = async (data) => {
  const { code, account_id, expiration_time } = data;

  try {
    const result = await repoAuth.saveRecoveryCode({
      code,
      account_id,
      expiration_time,
    });

    return result;
  } catch {
    throw ApiError(500, 'Failed to create recovery code', ErrorCodes.AUTH_RECOVERY_CODE_CREATION_FAILED, { account_id });
  }
};

const checkBlockedStatus = async (accountId) => {
  try {
    const verificationData = await repoAuth.getAccountVerificationAttempts(
      accountId
    );

    if (
      verificationData?.blocked_until &&
      dayjs().isBefore(verificationData.blocked_until)
    ) {
      const secondsLeft = dayjs(verificationData.blocked_until).diff(
        dayjs(),
        "second"
      );

      const minutesLeft = Math.floor(secondsLeft / 60);
      const remainingSeconds = secondsLeft % 60;

      let timeMessage;
      if (minutesLeft > 0) {
        timeMessage = `${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}`;
        if (remainingSeconds > 0) {
          timeMessage += ` and ${remainingSeconds} second${
            remainingSeconds > 1 ? "s" : ""
          }`;
        }
      } else {
        timeMessage = `${remainingSeconds} second${
          remainingSeconds > 1 ? "s" : ""
        }`;
      }

      throw ApiError(
        429,
        `Account blocked due to multiple failed attempts. Try again in ${timeMessage}`,
        ErrorCodes.AUTH_ACCOUNT_BLOCKED,
        {
          accountId,
          blocked_until: verificationData.blocked_until,
          seconds_left: secondsLeft
        }
      );
    }

    return verificationData;
  } catch (error) {
    if (error.code === ErrorCodes.AUTH_ACCOUNT_BLOCKED) {
      throw error;
    }
    logger.error(`Error checking blocked status: ${error.message}`);
    throw ApiError(500, 'Failed to check account blocked status', ErrorCodes.INTERNAL_SERVER_ERROR, { accountId });
  }
};

const checkCooldown = async (accountId) => {
  try {
    const data = await repoAuth.getAccountVerificationAttempts(accountId);

    if (data?.last_sent) {
      const minutesSinceLastSent = dayjs().diff(data.last_sent, "minute");
      if (minutesSinceLastSent < 1) {
        const secondsLeft = 60 - dayjs().diff(data.last_sent, "second");
        throw ApiError(
          429,
          `Wait ${secondsLeft} seconds before requesting another code`,
          ErrorCodes.AUTH_RATE_LIMIT,
          { accountId, seconds_left: secondsLeft }
        );
      }
    }
  } catch (error) {
    if (error.code === ErrorCodes.AUTH_RATE_LIMIT) {
      throw error;
    }
    logger.error(`Error checking cooldown: ${error.message}`);
    throw ApiError(500, 'Failed to check rate limit', ErrorCodes.INTERNAL_SERVER_ERROR, { accountId });
  }
};

const checkHourlyLimit = async (accountId) => {
  try {
    const data = await repoAuth.getAccountVerificationAttempts(accountId);
    const now = dayjs();

    if (
      !data?.hourly_window_start ||
      now.diff(data.hourly_window_start, "hour") >= 1
    ) {
      await repoAuth.updateAccountVerificationAttempts(accountId, {
        hourly_requests_count: 0,
        hourly_window_start: now.format("YYYY-MM-DD HH:mm:ss"),
      });
      return { canRequest: true };
    }

    if (data.hourly_requests_count >= 3) {
      const minutesLeft = 60 - now.diff(data.hourly_window_start, "minute");
      throw ApiError(
        429,
        `Hourly limit reached. Try again in ${minutesLeft} minutes`,
        ErrorCodes.AUTH_HOURLY_LIMIT,
        { accountId, minutes_left: minutesLeft }
      );
    }

    return { canRequest: true };
  } catch (error) {
    if (error.code === ErrorCodes.AUTH_HOURLY_LIMIT) {
      throw error;
    }
    logger.error(`Error checking hourly limit: ${error.message}`);
    throw ApiError(500, 'Failed to check hourly limit', ErrorCodes.INTERNAL_SERVER_ERROR, { accountId });
  }
};

const incrementVerificationAttempts = async (accountId) => {
  try {
    const data = await repoAuth.getAccountVerificationAttempts(accountId);
    const attempts = (data?.verification_attempts || 0) + 1;

    const updatePayload = { verification_attempts: attempts };

    if (attempts >= 3) {
      updatePayload.blocked_until = dayjs()
        .add(10, "minute")
        .format("YYYY-MM-DD HH:mm:ss");

      await repoAuth.expireAllActiveCodesForAccount(accountId);
    }

    await repoAuth.updateAccountVerificationAttempts(accountId, updatePayload);
  } catch (error) {
    logger.error(`Error incrementing verification attempts: ${error.message}`);
    throw ApiError(500, 'Failed to increment verification attempts', ErrorCodes.AUTH_VERIFICATION_ATTEMPTS_FAILED, { accountId });
  }
};

module.exports = {
  sendRecoveryCode,
  createRecoveryCode,
  sendWACode,
  checkBlockedStatus,
  checkCooldown,
  checkHourlyLimit,
  incrementVerificationAttempts,
};
