/* eslint-disable no-control-regex */
const dayjs = require("dayjs");
const { OpenAI } = require("openai");
const logger = require("../utils/logger");
const repoBot = require("../repositories/bots");
const repoCompany = require("../repositories/company");
const repoFilemanager = require("../repositories/fileManager");

class ImageProcessingHelper {
  constructor() {
    this.imageUrlRegex =
      /https?:\/\/[^\s<>"{}|\\^`[\]]*\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?[^\s<>"{}|\\^`[\]]*)?/gi;
    this.maxUrls = 50;
    this.maxUrlLength = 2048;
    this.defaultOptions = {
      maxRetries: 3,
      retryDelay: 1000,
      enableFallback: true,
      fallbackTimeout: 15000,
    };
  }

  sanitizePromptText = (text) => {
    if (typeof text !== "string") return "";
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  };

  hasImageUrls = (text) => {
    if (typeof text !== "string" || !text.trim()) return false;

    this.imageUrlRegex.lastIndex = 0;
    return this.imageUrlRegex.test(text);
  };

  isValidUrl = (url) => {
    try {
      return ["http:", "https:"].includes(new URL(url).protocol);
    } catch {
      return false;
    }
  };
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  getDelayWithJitter = (baseDelay, attempt) =>
    Math.floor(
      baseDelay * Math.pow(2, attempt - 1) * (1 + Math.random() * 0.1)
    );

  /**
   * Validates URLs in the text
   */
  validateUrlCount(text, maxUrls = this.maxUrls) {
    this.imageUrlRegex.lastIndex = 0;
    const urls = [...text.matchAll(this.imageUrlRegex)].map((m) => m[0]);

    const longUrl = urls.find((url) => url.length > this.maxUrlLength);
    if (longUrl) {
      return {
        isValid: false,
        urlCount: urls.length,
        urls,
        error: `URL too long: ${longUrl.slice(0, this.maxUrlLength)}...`,
      };
    }

    if (urls.length > maxUrls) {
      return {
        isValid: false,
        urlCount: urls.length,
        urls,
        error: `URLs (${urls.length}) exceed limit of ${maxUrls}`,
      };
    }

    return { isValid: true, urlCount: urls.length, urls, error: null };
  }

  /**
   * Verifica si las URLs han cambiado
   */
  urlsChanged(promptText, currentImages = []) {
    if (currentImages.length === 0) {
      return this.hasImageUrls(promptText);
    }

    const currentUrls = new Set(currentImages.map((img) => img.url));

    this.imageUrlRegex.lastIndex = 0;
    const foundUrls = [...promptText.matchAll(this.imageUrlRegex)].map(
      (match) => match[0]
    );

    return (
      foundUrls.length !== currentUrls.size ||
      foundUrls.some((url) => !currentUrls.has(url))
    );
  }

  /**
   * Determines whether image processing is needed
   */
  needsImageProcessing(promptText, currentMetadata = {}) {
    try {
      if (!this.hasImageUrls(promptText)) return false;

      const { rejected_images = [], available_images = [] } =
        currentMetadata || {};
      const allImages = [...rejected_images, ...available_images];

      return Array.isArray(available_images)
        ? this.urlsChanged(promptText, allImages)
        : true;
    } catch (error) {
      logger.error(`Error checking image processing needs: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets OpenAI/OpenRouter configuration
   */
  async getAIConfig(companyID, botID) {
    const getConfig = async (key) => {
      const [config] = await repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": key,
      });
      return config?.data || "";
    };

    let apiKey = await getConfig("BRAIN_OPENROUTER_KEY");
    let useOpenRouter = true;

    if (!apiKey) {
      apiKey = await getConfig("OPENAI_KEY");
      useOpenRouter = false;
    }

    if (!apiKey) throw new Error("OpenAI or OpenRouter Key not configured.");

    return { apiKey, useOpenRouter };
  }

  /**
   * AI extraction (simplified)
   */
  async extractWithAI(
    sanitizedText,
    companyID,
    botID,
    options = {},
    attempt = 1
  ) {
    const opts = { ...this.defaultOptions, ...options };

    try {
      const { apiKey, useOpenRouter } = await this.getAIConfig(
        companyID,
        botID
      );
      const openai = new OpenAI({
        ...(useOpenRouter && { baseURL: "https://openrouter.ai/api/v1" }),
        apiKey,
        timeout: opts.fallbackTimeout,
      });

      const systemPrompt = `
You are a prompt analyzer for WhatsApp bots. Your task is to extract image URLs and generate appropriate descriptions.

Analyze the text and find all image URLs (jpg, jpeg, png, gif, webp, svg, bmp, ico).

IMPORTANT LIMITS:
- Maximum ${this.maxUrls} URLs per prompt
- URLs must not exceed ${this.maxUrlLength} characters

For each URL found, generate:
- A clear description based on context

IMPORTANT: Respond ONLY in valid JSON format, with no additional text:
{
  "images_found": number,
  "available_images": [
    {
      "url": "Full URL",
      "description": "Clear and concise description", 
      "context": "context where it appeared"
    }
  ]
}`;

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze this bot prompt:\n\n${sanitizedText}`,
          },
        ],
        model: useOpenRouter ? "openrouter/auto" : "gpt-4o",
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Empty AI response");

      const parsed = JSON.parse(content);
      if (
        !parsed ||
        typeof parsed.images_found !== "number" ||
        !Array.isArray(parsed.available_images)
      ) {
        throw new Error(`Invalid JSON structure: ${JSON.stringify(parsed)}`);
      }

      if (parsed.images_found > this.maxUrls) {
        throw new Error(
          `AI found too many image URLs, exceeds the limit of ${this.maxUrls}`
        );
      }

      const longUrl = parsed.available_images.find(
        (img) => img.url?.length > this.maxUrlLength
      );
      if (longUrl) {
        throw new Error(`Url too long`);
      }

      const totalTokens = completion.usage?.total_tokens || 0;
      if (totalTokens > 0) {
        await repoBot.saveBotUsedTokens({
          company_id: companyID,
          bot_id: botID,
          tokens: totalTokens,
          credits: 0,
          metadata: JSON.stringify({
            ...completion.usage,
            extraction_method: "ai",
            attempt,
            text_length: sanitizedText.length,
          }),
          date: dayjs().format("YYYY-MM-DD"),
        });
      }

      return { ...parsed, extraction_method: "ai", attempt_number: attempt };
    } catch (error) {
      if (
        attempt >= opts.maxRetries ||
        error.message.includes("not configured")
      ) {
        throw error;
      }

      await this.delay(this.getDelayWithJitter(opts.retryDelay, attempt));
      return this.extractWithAI(
        sanitizedText,
        companyID,
        botID,
        options,
        attempt + 1
      );
    }
  }

  /**
   * Fallback extraction (simplified)
   */
  fallbackExtraction(text) {
    const validation = this.validateUrlCount(text);
    if (!validation.isValid) throw new Error(validation.error);

    const availableImages = validation.urls.map((url, index) => {
      const lines = text.split("\n");
      const lineWithUrl = lines.find((line) => line.includes(url)) || "";
      const context =
        lineWithUrl.replace(url, "").trim() || `Image ${index + 1}`;
      const description =
        context.length > 0
          ? `${context.charAt(0).toUpperCase()}${context.slice(1)}`
          : `Image ${index + 1} extracted from context`;

      return { url, description, context };
    });

    return {
      images_found: validation.urls.length,
      available_images: availableImages,
      extraction_method: "fallback",
    };
  }

  /**
   * Extracts images (AI + fallback)
   */
  async extractImagesFromPrompt(promptText, companyID, botID, options = {}) {
    const { enableFallback = true } = options;

    if (!promptText || typeof promptText !== "string") {
      throw new Error("The prompt must be a valid string");
    }
    if (!companyID || !botID) {
      throw new Error("companyID and botID are required");
    }

    const sanitizedText = this.sanitizePromptText(promptText);

    try {
      return await this.extractWithAI(sanitizedText, companyID, botID, options);
    } catch (aiError) {
      if (!enableFallback) {
        throw new Error(`AI extraction error: ${aiError.message}`);
      }

      try {
        const fallbackResult = this.fallbackExtraction(sanitizedText);

        await repoBot.saveBotUsedTokens({
          company_id: companyID,
          bot_id: botID,
          tokens: 0,
          credits: 0,
          metadata: JSON.stringify({
            extraction_method: "fallback",
            ai_error: aiError.message,
            fallback_images_found: fallbackResult.images_found,
            text_length: sanitizedText.length,
          }),
          date: dayjs().format("YYYY-MM-DD"),
        });

        return fallbackResult;
      } catch (fallbackError) {
        throw new Error(
          `AI failed: ${aiError.message}. Fallback failed: ${fallbackError.message}`
        );
      }
    }
  }

  /**
   * Filters valid images
   */
  async filterImages(extractionResult, companyID, additionalConditions = {}) {
    const startTime = Date.now();
    const createResult = (available, rejected, error = null) => ({
      images_found: extractionResult.images_found || 0,
      images_after_filter: available.length,
      images_rejected: rejected.length,
      available_images: available,
      rejected_images: rejected,
      processing_time_ms: Date.now() - startTime,
      ...(error && { error }),
    });

    try {
      const { available_images = [] } = extractionResult;
      if (!companyID) throw new Error("companyID and botID are required");

      const validUrls = [
        ...new Set(
          available_images
            .map((img) => img?.url)
            .filter(
              (url) => url && typeof url === "string" && this.isValidUrl(url)
            )
        ),
      ];

      if (validUrls.length === 0) {
        const rejected = available_images.map((img) => ({
          ...img,
          rejection_reason: img?.url
            ? "Invalid URL format"
            : "Missing URL",
        }));
        return createResult([], rejected);
      }

      let validRows = [];
      try {
        validRows = await repoFilemanager.getRawFilesByField(
          {
            "filemanager_files.company_id": companyID,
            ...additionalConditions,
          },
          false,
          "path",
          validUrls
        );
      } catch (err) {
        logger.error(`Error querying filemanager_files: ${err.message}`);
      }

      const validPathsMap = new Map(
        validRows.map((row) => [row.path, { uuid_unique: row.uuid_unique }])
      );

      const filtered = [];
      const rejected = [];

      available_images.forEach((image) => {
        if (!image?.url) {
          rejected.push({ ...image, rejection_reason: "Missing URL" });
        } else if (!this.isValidUrl(image.url)) {
          rejected.push({
            ...image,
            rejection_reason: "Invalid URL format",
          });
        } else if (validPathsMap.has(image.url)) {
          const dbData = validPathsMap.get(image.url);
          filtered.push({
            ...image,
            uuid_unique: dbData.uuid_unique,
          });
        } else {
          rejected.push({
            ...image,
            rejection_reason: "URL not registered in filemanager_files",
          });
        }
      });

      logger.info(
        `Filtering completed: ${filtered.length} valid, ${rejected.length} rejected`
      );
      return createResult(filtered, rejected);
    } catch (error) {
      logger.error(`Error in filterImages: ${error.message}`);
      const allRejected = (extractionResult?.available_images || []).map(
        (img) => ({
          ...img,
          rejection_reason: `Processing error: ${error.message}`,
        })
      );
      return createResult([], allRejected, error.message);
    }
  }

  /**
   * Main function - processes prompt images
   */
  async processPromptImages(promptText, companyID, botID, options = {}) {
    const startTime = Date.now();
    const createErrorResult = (error) => ({
      images_found: 0,
      images_after_filter: 0,
      images_rejected: 0,
      available_images: [],
      rejected_images: [],
      processing_time_ms: Date.now() - startTime,
      error: error.message,
    });

    try {
      if (!promptText || typeof promptText !== "string") {
        throw new Error("Prompt must be a valid string");
      }
      if (!companyID || !botID) {
        throw new Error("companyID and botID are required");
      }

      const sanitizedText = this.sanitizePromptText(promptText);
      const validation = this.validateUrlCount(sanitizedText);

      if (!validation.isValid) throw new Error(validation.error);

      if (validation.urlCount === 0) {
        return {
          images_found: 0,
          images_after_filter: 0,
          images_rejected: 0,
          available_images: [],
          rejected_images: [],
          processing_time_ms: Date.now() - startTime,
        };
      }

      const extractOptions = { ...this.defaultOptions, ...options };

      logger.info(
        `Starting extraction for bot ${botID}, company ${companyID}. URLs found: ${validation.urlCount}`
      );

      const extractionResult = await this.extractImagesFromPrompt(
        sanitizedText,
        companyID,
        botID,
        extractOptions
      );
      const filteredResult = await this.filterImages(
        extractionResult,
        companyID
      );

      logger.info(
        `Processing completed: ${filteredResult.images_found} processed, ${filteredResult.images_after_filter} valid`
      );

      return {
        ...filteredResult,
        extraction_method: extractionResult.extraction_method,
      };
    } catch (error) {
      logger.error(`Error in processPromptImages: ${error.message}`);
      return createErrorResult(error);
    }
  }
}

module.exports = new ImageProcessingHelper();
