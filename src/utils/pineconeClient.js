const { Pinecone } = require("@pinecone-database/pinecone");
const repoCompany = require("../repositories/company");
const { verifyPineconeApiKey } = require("./verifyPineconeApiKey");

let pineconeClient = null;

const getPineconeClient = async (botID) => {
  try {
    const apiKey = await getConfigPineconeByBot(botID);
    const isAuthClientDifferent = pineconeClient?.config?.apiKey !== apiKey;

    if (!pineconeClient || isAuthClientDifferent) {
      pineconeClient = new Pinecone({ apiKey });
    }

    return pineconeClient;
  } catch (error) {
    throw new Error(error);
  }
};

const getConfigPineconeByBot = async (botID) => {
  try {
    const [pineconeStatusConfig] = await repoCompany.getCompanyConfigByField({
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "PINECONE_STATUS",
    });
    if (!pineconeStatusConfig || pineconeStatusConfig.data === "false") {
      throw new Error("Pinecone is not enabled");
    }

    const [pineconeApiKeyConfig] = await repoCompany.getCompanyConfigByField({
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "PINECONE_API_KEY",
    });

    if (
      !pineconeApiKeyConfig ||
      !pineconeApiKeyConfig.data ||
      pineconeApiKeyConfig.data.trim() == ""
    ) {
      throw new Error("Pinecone API Key not found");
    }

    await verifyPineconeApiKey(pineconeApiKeyConfig.data, botID);

    return pineconeApiKeyConfig.data;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getPineconeClient,
};
