const { google } = require("googleapis");
const repoCompany = require("../../repositories/company");
const logger = require("../logger");

let oAuthClient = null;
const getGoogleClientByBot = async (botID) => {
  try {
    const { clientID, secretID } = await getConfigGoogleByBot(botID);

    const isEmptyAuth = !oAuthClient?._clientId && !oAuthClient?._clientSecret;
    const isAuthClientDifferent =
      oAuthClient?._clientId !== clientID &&
      oAuthClient?._clientSecret !== secretID;


    if (isEmptyAuth || isAuthClientDifferent) {
      oAuthClient = new google.auth.OAuth2(
        clientID,
        secretID,
        process.env.GOOGLE_REDIRECT_URI
      );
    }
    return oAuthClient;
  } catch (error) {
    logger.error(`[getGoogleClientByBot] Error getting Google client for bot ${botID}: ${error.message}`);
    throw new Error(error);
  }
};

const getConfigGoogleByBot = async (botID) => {
  try {
    const [clientIdConfig] = await repoCompany.getCompanyConfigByField({
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "GOOGLE_CALENDAR_CLIENT_ID",
    });
    if (!clientIdConfig || !clientIdConfig.data) {
      throw new Error("Client ID not found");
    }

    const [secretIdConfig] = await repoCompany.getCompanyConfigByField({
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "GOOGLE_CALENDAR_CLIENT_SECRET",
    });
    if (!secretIdConfig || !secretIdConfig.data) {
      throw new Error("Client Secret not found");
    }

    return { clientID: clientIdConfig.data, secretID: secretIdConfig.data };
  } catch (error) {
    logger.error(`[getConfigGoogleByBot] Error getting Google config for bot ${botID}: ${error.message}`);
    throw new Error(error);
  }
};

module.exports = { getGoogleClientByBot };
