const db = require("../utils/db");
const logger = require("../utils/logger");

const saveCampaignMessage = async (data) => {
  try {
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    logger.info(`saveCampaignMessage with data: ${JSON.stringify(data)}`);

    const [messageID] = await db("campaigns_messages_history").insert(data);

    const response = messageID
      ? (await db("campaigns_messages_history").where({ id: messageID }))[0]
      : false;

    logger.info(`saveCampaignMessage response data: ${JSON.stringify(response)}`);

    return response;
  } catch (e) {
    logger.error(
      `Error saving message with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving message: ${e}`);
  }
};

const getCampaignMessageByField = async (where, isRaw = false) => {
  try {
    const query = db("campaigns_messages_history");

    if (isRaw) {
      query.whereRaw(where);
    } else {
      query.where(where);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting message with data: ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting message: ${e}`);
  }
};

const getLastCampaignMessage = async (where, isRaw = false) => {
  try {
    const query = db("campaigns_messages_history")
      .orderBy("created_at", "desc")
      .limit(1);

    if (isRaw) {
      query.whereRaw(where);
    } else {
      query.where(where);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(`Error getting last message: ${JSON.stringify(e)}`);
    throw new Error(`Error getting last message: ${e}`);
  }
};

const updateCampaignMessageStatus = async (uuid, data) => {
  try {
    logger.info(`Updating message status to ${data.status}`);

    return await db("campaigns_messages_history").where({ uuid_unique: uuid }).update(data);
  } catch (e) {
    logger.error(
      `Error updating message status for id ${uuid}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating message: ${e}`);
  }
};

module.exports = {
  saveCampaignMessage,
  getCampaignMessageByField,
  getLastCampaignMessage,
  updateCampaignMessageStatus,
};