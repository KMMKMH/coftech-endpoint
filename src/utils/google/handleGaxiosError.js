const repoBots = require("../../repositories/bots");

const modelBots = require("../../models/bots");

const { GaxiosError } = require("gaxios");
const logger = require("../../utils/logger");

const handleGaxiosError = async (error) => {
  logger.info(`[handleGaxiosError] Handling error: ${error.constructor.name}`);

  if (error instanceof GaxiosError) {
    logger.info(`[handleGaxiosError] GaxiosError detected with status: ${error.response?.status}`);

    if (error.response.status === 400) {
      logger.info(`[handleGaxiosError] Processing 400 error - token revocation`);

      const { responseURL } = error.response.request;
      const token = new URL(responseURL).searchParams.get("token");
      logger.info(`[handleGaxiosError] Extracted token from URL: ${token?.substring(0, 10)}...`);

      const [botRefreshTokenField] = await repoBots.getBotsRefreshTokenByField(
        `bots_refresh_tokens.credentials LIKE '%${token}%'`,
        true
      );
      logger.info(`[handleGaxiosError] Bot refresh token found: ${!!botRefreshTokenField}`);

      if (!botRefreshTokenField) {
        logger.error(`[handleGaxiosError] Refresh Token not found. token: ${token}`);
        return;
      }

      const { bot_id: botID } = botRefreshTokenField;
      logger.info(`[handleGaxiosError] Deleting refresh token for bot: ${botID}`);

      await repoBots.deleteBotsRefreshToken({
        "bots_refresh_tokens.bot_id": botID,
      });

      const message =
        "Google authentication has been revoked. Please re-authenticate your Google account.";

      logger.info(`[handleGaxiosError] Sending revocation message to bot: ${botID}`);
      await modelBots.sendWhitelistMessagesBot(
        { botID },
        {
          message,
        }
      );

      logger.info(`[handleGaxiosError] Successfully handled token revocation for bot: ${botID}`);
    } else {
      logger.info(`[handleGaxiosError] Non-400 GaxiosError status: ${error.response.status} - no action taken`);
    }
  } else {
    logger.info(`[handleGaxiosError] Non-GaxiosError: ${error.constructor.name} - no action taken`);
  }
};

module.exports = {
  handleGaxiosError,
};
