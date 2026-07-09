const db = require("../utils/db");
const logger = require("../utils/logger");

const getScopesByField = async (data, isRaw = false) => {
  try {
    const query = db("google_scopes");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting google_scopes with data: ${JSON.stringify(
        data,
      )} ${isRaw}, error: ${JSON.stringify(error)}`,
    );
    throw new Error(`Error getting google_scopes`);
  }
};

module.exports = {
  getScopesByField,
};
