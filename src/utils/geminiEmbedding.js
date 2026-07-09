const { GoogleGenerativeAI } = require("@google/generative-ai");
const repoCompany = require("../repositories/company");
const modelBots = require("../models/bots");
const logger = require("./logger");
const { verifyGeminiApiKey } = require("./verifyGeminiApiKey");

const geminiEmbedding = async (text, metadata, companyID, botID) => {
  try {
    const [geminiStatusConfig] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "GEMINI_STATUS",
    });

    if (!geminiStatusConfig || geminiStatusConfig.data === "false") {
      throw new Error("gemini is not enabled");
    }

    const [geminiRagModel] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "GEMINI_RAG_MODEL",
    });

    if (!geminiRagModel || geminiRagModel.data === "") {
      throw new Error("gemini model rag model not found");
    }

    const [geminiApiKeyConfig] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "GEMINI_API_KEY",
    });

    if (!geminiApiKeyConfig || geminiApiKeyConfig.data === "") {
      const bodyMessage = {
        message:
          "The Gemini API key is missing or not configured properly. Please check the settings.",
      };

      await modelBots.sendMessageToAdmins({ companyID, botID }, bodyMessage);

      throw new Error("gemini API Key is not set");
    }

    await verifyGeminiApiKey(
      geminiApiKeyConfig.data,
      geminiRagModel.data,
      botID
    );

    if (typeof text !== "string" || text.trim() === "") {
      throw new Error("The 'text' parameter must be a non-empty string.");
    }

    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      metadata = {};
    }

    const genAI = new GoogleGenerativeAI(geminiApiKeyConfig.data);
    const model = genAI.getGenerativeModel({ model: geminiRagModel.data });

    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
    });

    if (!result.embedding || !Array.isArray(result.embedding.values)) {
      throw new Error(
        "Invalid response from Google Gemini API: missing embedding values."
      );
    }

    const uniqueID = metadata.id;
    delete metadata.id;

    return [
      {
        id: uniqueID,
        values: result.embedding.values,
        metadata: { ...metadata, text },
      },
    ];
  } catch (error) {
    logger.error("Error in geminiEmbedding:", error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};


module.exports = { geminiEmbedding };
