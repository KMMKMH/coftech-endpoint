const axios = require("axios");
const { OpenAI } = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require("@pinecone-database/pinecone");

const logger = require("./logger");

class BaseApiKeyValidator {
  // eslint-disable-next-line
  async validate(apiKey) {
    throw new Error("Method 'validate' must be implemented.");
  }
}

class OpenAIApiKeyValidator extends BaseApiKeyValidator {
  async validate(apiKey) {
    try {
      const openAI = new OpenAI({ apiKey });
      await openAI.models.list();
      logger.info("OpenAI API key is valid.");

      return true;
    } catch (error) {
      logger.error("Error validating OpenAI API key:", error);
      return false;
    }
  }
}

class GeminiApiKeyValidator extends BaseApiKeyValidator {
  async validate(apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const testModel = genAI.getGenerativeModel({
        model: "models/gemini-embedding-001",
      });
      const result = await testModel.embedContent({
        content: { parts: [{ text: "test" }] },
        taskType: "RETRIEVAL_DOCUMENT",
      });

      if (!result.embedding || !Array.isArray(result.embedding.values)) {
        throw new Error("Invalid response from Gemini API.");
      }

      logger.info("Gemini API key is valid.");
      return true;
    } catch (error) {
      logger.error("Error validating Gemini API key:", error);
      return false;
    }
  }
}

class OpenRouterApiKeyValidator extends BaseApiKeyValidator {
  async validate(apiKey) {
    try {
      const response = await axios.get("https://openrouter.ai/api/v1/key", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (response.status === 200) {
        logger.info("OpenRoute API key is valid.");
        return true;
      }

      logger.error(
        "OpenRoute API key validation failed with status:",
        response.status
      );
      return false;
    } catch (error) {
      logger.error(
        "Error validating OpenRoute API key:",
        error.response.statusText
      );
      return false;
    }
  }
}

class PineConeApiKeyValidator extends BaseApiKeyValidator {
  async validate(apiKey) {
    try {
      const pinecone = new Pinecone({ apiKey });
      await pinecone.listIndexes();
      logger.info("Pinecone API key is valid.");
      return true;
    } catch (error) {
      logger.error("Error validating Pinecone API key:", error);
      return false;
    }
  }
}

class ElevenLabsApiKeyValidator extends BaseApiKeyValidator {
  async validate(apiKey) {
    try {
      const response = await axios.get("https://api.elevenlabs.io/v1/models", {
        headers: {
          "xi-api-key": apiKey,
        },
      });

      if (response.status === 200) {
        logger.info("ElevenLabs API key is valid.");
        return true;
      }

      logger.error(
        "ElevenLabs API key validation failed with status:",
        response.status
      );
      return false;
    } catch (error) {
      logger.error(
        "Error validating ElevenLabs API key:",
        error.response.statusText
      );
      return false;
    }
  }
}

class GloriaFoodApiKeyValidator extends BaseApiKeyValidator {
  async validate(apiKey) {
    try {
      const response = await axios.get(
        "https://pos.globalfoodsoft.com/pos/menu",
        {
          headers: {
            Authorization: apiKey,
            Accept: "application/json",
            "Glf-Api-Version": "2.0",
          },
        }
      );
      if (response.status === 200) {
        logger.info("GloriaFood API key is valid.");
        return true;
      }
      logger.error(
        "GloriaFood API key validation failed with status:",
        response.status
      );
      return false;
    } catch (error) {
      logger.error(
        "Error validating GloriaFood API key:",
        error.response.status
      );
      return false;
    }
  }
}

const apiKeyValidatorHandler = async (data) => {
  const { config, apiKey } = data;
  const mapper = {
    OPENAI_KEY: OpenAIApiKeyValidator,
    ADMIN_API_KEY: OpenAIApiKeyValidator,
    SPEECH_TO_TEXT_OPENAI_KEY: OpenAIApiKeyValidator,
    GPT_SPEECH_TO_SPEECH_OPENAI_KEY: OpenAIApiKeyValidator,
    GEMINI_API_KEY: GeminiApiKeyValidator,
    BRAIN_OPENROUTER_KEY: OpenRouterApiKeyValidator,
    PINECONE_API_KEY: PineConeApiKeyValidator,
    ELEVENLABS_KEY: ElevenLabsApiKeyValidator,
    GLORIA_FOOD_AUTH_TOKEN: GloriaFoodApiKeyValidator,
  };

  const ValidatorClass = mapper[config];
  if (!ValidatorClass) {
    throw new Error(`No validator found for config: ${config}`);
  }

  const validator = new ValidatorClass();
  return await validator.validate(apiKey);
};

module.exports = {
  OpenAIApiKeyValidator,
  GeminiApiKeyValidator,
  OpenRouterApiKeyValidator,
  PineConeApiKeyValidator,
  ElevenLabsApiKeyValidator,
  GloriaFoodApiKeyValidator,
  apiKeyValidatorHandler,
};
