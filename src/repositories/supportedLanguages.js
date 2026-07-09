const db = require("../utils/db");
const logger = require("../utils/logger");

const listSupportedLanguages = async () => {
  try {
    const result = await db("supported_languages").select("iso_639_1_code");
    return result.map(r => r.iso_639_1_code);
  } catch (error) {
    logger.error(
      `Error in listSupportedLanguages: ${error.message}`
    );
    return [];
  }
};

module.exports = { listSupportedLanguages };
