const db_noco = require("../utils/db_noco");
const logger = require("../utils/logger");

const updateAccount = async (where, data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    logger.info(
      `Updating noco_account with where: ${JSON.stringify(
        where
      )}, data: ${JSON.stringify(data)}`
    );

    const response = await db_noco("nc_users_v2").where(where).update(data);

    logger.info(`Update noco_account response: ${response}`);
    return response;
  } catch (e) {
    logger.error(
      `Error updating noco_account with where: ${JSON.stringify(
        where
      )}, data: ${JSON.stringify(data)}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating noco_account`);
  }
};

const getAccountByField = async (data) => {
  try {
    logger.info(`Getting noco_account with data: ${JSON.stringify(data)}`);

    const response = await db_noco("nc_users_v2").where(data);

    logger.info(`Get noco_account response: ${response}`);
    return response;
  } catch (e) {
    logger.error(
      `Error getting noco_account with data: ${JSON.stringify(data)}, error: ${JSON.stringify(
        e
      )}`
    );
    throw new Error(`Error getting noco_account`);
  }
}

module.exports = {
  updateAccount,
  getAccountByField,
};
