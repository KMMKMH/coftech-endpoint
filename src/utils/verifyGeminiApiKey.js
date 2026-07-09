const { GoogleGenerativeAI } = require("@google/generative-ai");
const { sendEmailToAdmins } = require("./email/sendEmailToAdmins");

const GEMINI_ERROR_MESSAGES = {
  401: "The Gemini key is invalid or has been revoked.",
  403: "The API key does not have permissions or is in a blocked region.",
  429: "The account has exceeded the usage limit or has no credits.",
  503: "The Gemini API is temporarily inactive or overloaded.",
};

const verifyGeminiApiKey = async (
  apiKey,
  model = "models/embedding-001",
  bot_id
) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const testModel = genAI.getGenerativeModel({ model });

    const result = await testModel.embedContent({
      content: { parts: [{ text: "test" }] },
      taskType: "RETRIEVAL_DOCUMENT",
    });

    if (!result.embedding || !Array.isArray(result.embedding.values)) {
      throw new Error("Invalid response from Gemini API.");
    }

    return { success: true };
  } catch (error) {
    const status = error?.status || error?.code || null;
    const message =
      GEMINI_ERROR_MESSAGES[status] || error.message || "Unknown error";

    if (bot_id && status === 429) {
      const emailData = {
        bot_id,
        type: "no-credits",
        service: "Gemini",
        details: message,
      };

      try {
        await sendEmailToAdmins(emailData);
      } catch (emailError) {
        console.error("Error sending email to admins:", emailError.message);
      }
    }

    return {
      success: false,
      error: {
        status,
        message,
      },
    };
  }
};

module.exports = { verifyGeminiApiKey };
