const logger = require("../utils/logger");
const db = require("../utils/db");

const saveCampaign = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    logger.info(`Saving campaign with data: ${JSON.stringify(data)}`);

    const campaignID = await db("campaigns").insert(data);

    const response = campaignID
      ? (await getCampaignsByField({ "campaigns.id": campaignID[0] }))[0]
      : false;

    return response;
  } catch (error) {
    logger.error(
      `Error saving campaign with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(error);
  }
};

const getCampaignsByField = async (data, isRaw = false) => {
  try {
    const query = db("campaigns");

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
      `Error getting campaigns by field: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(error);
  }
};

const updateCampaign = async (where, data) => {
  try {
    logger.info(
      `updateCampaign where: ${JSON.stringify(
        where
      )} with data: ${JSON.stringify(data)}`
    );
    return await db("campaigns").where(where).update(data);
  } catch (e) {
    logger.error(
      `Error updating campaign with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating campaign`);
  }
};

const saveCampaignLog = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    logger.info(`Saving campaign log with data: ${JSON.stringify(data)}`);

    const campaignLogID = await db("campaigns_logs").insert(data);
    const response = campaignLogID
      ? (await getCampaignsLogsByField({ "campaigns_logs.id": campaignLogID[0] }))[0]
      : false;

    return response;
  } catch (error) {
    logger.error(
      `Error saving campaign log with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(error);
  }
};

const getCampaignsLogsByField = async (data, isRaw = false) => {
  try {
    const query = db("campaigns_logs");

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
      `Error getting campaign logs by field: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(error);
  }
};

const updateCampaignLog = async (where, data) => {
  try {
    logger.info(
      `updateCampaignLog where: ${JSON.stringify(
        where
      )} with data: ${JSON.stringify(data)}`
    );
    return await db("campaigns_logs").where(where).update(data);
  } catch (e) {
    logger.error(
      `Error updating campaign log with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating campaign log`);
  }
};

module.exports = {
  saveCampaign,
  getCampaignsByField,
  updateCampaign,
  saveCampaignLog,
  getCampaignsLogsByField,
  updateCampaignLog,
};
