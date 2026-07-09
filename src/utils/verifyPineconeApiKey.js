const { Pinecone } = require("@pinecone-database/pinecone");
const { sendEmailToAdmins } = require("./email/sendEmailToAdmins");

const PINECONE_ERROR_MESSAGES = {
  400: "Invalid request to Pinecone. Verify the submitted arguments.",
  401: "The Pinecone API key is invalid or missing. Field: 'PINECONE_API_KEY'.",
  402: "Payment is required in Pinecone. You do not have enough credits or your account has pending payments.",
  403: "Access denied by Pinecone. Quota exceeded or index deletion protection is enabled.",
  404: "The requested Pinecone resource was not found.",
  409: "The resource already exists in Pinecone. Check for duplicates.",
  412: "The request does not meet Pinecone preconditions.",
  422: "Pinecone could not process the received instructions.",
  429: "You have exceeded the allowed Pinecone request limit.",
  500: "Internal Pinecone server error.",
  503: "The Pinecone service is currently unavailable.",
};

const verifyPineconeApiKey = async (apiKey, bot_id) => {
  try {
    const pinecone = new Pinecone({ apiKey });

    const listIndexes = await pinecone.listIndexes();

    if (!Array.isArray(listIndexes)) {
      throw new Error("Invalid response from Pinecone API.");
    }

    return { success: true };
  } catch (error) {
    const status = error?.status || error?.code || null;
    const message =
      PINECONE_ERROR_MESSAGES[status] || error.message || "Unknown error";

    if (bot_id && (status === 402 || status === 429)) {
      const emailData = {
        bot_id,
        type: "no-credits",
        service: "Pinecone",
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

module.exports = {
  verifyPineconeApiKey,
};
