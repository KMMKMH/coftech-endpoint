const { getGoogleClientByBot } = require("./GoogleClient");
const dayjs = require("dayjs");

const repoBots = require("../../repositories/bots");
const logger = require("../logger");

async function setGoogleCredencials(botID) {
  try {
    const [botRefreshTokenField] = await repoBots.getBotsRefreshTokenByField({
      "bots_refresh_tokens.bot_id": botID,
    });

    if (!botRefreshTokenField) {
      throw new Error(`Bot ID ${botID} has no refresh token.`);
    }

    const { refresh_token, credentials } = botRefreshTokenField;
    const { expiry_date } = credentials;

    const oAuth2Client = await getGoogleClientByBot(botID);

    const isExpired = dayjs().isAfter(dayjs(expiry_date));

    if (isExpired) {
      oAuth2Client.setCredentials({
        refresh_token: refresh_token,
      });

      const newToken = await oAuth2Client.refreshAccessToken();

      if (newToken.res.status !== 200) {
        throw new Error(`Error getting new token`);
      }

      const { res: response } = newToken;
      await repoBots.updateBotsRefreshToken(
        {
          "bots_refresh_tokens.bot_id": botID,
        },
        { "bots_refresh_tokens.credentials": JSON.stringify(response.data) }
      );
      oAuth2Client.setCredentials(response.data);
    } else {
      oAuth2Client.setCredentials(credentials);
    }

    return oAuth2Client;
  } catch (error) {
    logger.error(`[setGoogleCredencials] Error setting credentials for bot ${botID}: ${error.message}`);
    throw new Error(error);
  }
}

module.exports = { setGoogleCredencials };
