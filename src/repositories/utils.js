const db = require("../utils/db");
const logger = require("../utils/logger");

const customQuery = async (query, bindings = []) => {
  try {
    logger.info(`customQuery with query: ${query}, bindings: ${JSON.stringify(bindings)}`);
    return await db.raw(query, bindings);
  } catch (error) {
    logger.error(
      `Error customQuery with query: ${query}, bindings: ${JSON.stringify(
        bindings
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error customQuery`);
  }
};

const insertCronQueue = async (data) => {
  try {
    logger.info(`cronQueue with data: ${JSON.stringify(data)}`);
    const [id] = await db("cron_queue_table").insert(data);
    const response = (
      await getCronQueueByField({ "cron_queue_table.id": id })
    )[0];

    logger.info(`cronQueue response data: ${JSON.stringify(response)}`);
    return response;
  } catch (e) {
    logger.error(
      `Error saving cron queue with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );

    throw new Error(`Error saving cron queue`);
  }
};

const getCronQueueByField = async (data, isRaw = false) => {
  try {
    const query = db("cron_queue_table");

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
  } catch (e) {
    logger.error(
      `Error getting cron_queue_table with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting cron_queue_table data`);
  }
};

const updateCronQueueStatus = async (where) => {
  try {
    logger.info(`updateCronQueueStatus where: ${JSON.stringify(where)}`);
    return await db("cron_queue_table")
      .where(where)
      .update({ "cron_queue_table.status": true });
  } catch (e) {
    logger.error(
      `Error updating cron_queue_table where: ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating cron_queue_table`);
  }
};

const getCountriesByField = async (data, isRaw = false) => {
  try {
    const query = db("countries");

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
  } catch (e) {
    logger.error(
      `Error getting countries with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting countries`);
  }
};

const getCurrenciesByField = async (data, isRaw = false) => {
  try {
    const query = db("currencies");

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
      `Error getting currencies with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting currencies`);
  }
};
const saveToken = async (data) => {
  try {
    if (data.allowed_endpoints) {
      data.allowed_endpoints = JSON.stringify(data.allowed_endpoints);
    }

    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    const [tokenID] = await db("tokens").insert(data);

    return tokenID ? (await db("tokens").where({ id: tokenID }))[0] : false;
  } catch (e) {
    logger.error(
      `Error saving token with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving token: ${e}`);
  }
};

const updateToken = async (where, data) => {
  try {
    if (data.allowed_endpoints) {
      data.allowed_endpoints = JSON.stringify(data.allowed_endpoints);
    }

    return await db("tokens").where(where).update(data);
  } catch (e) {
    logger.error(
      `Error updating token with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating token: ${e}`);
  }
};

const getTokenByField = async (data, isRaw = false) => {
  try {
    const query = db("tokens");

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
  } catch (e) {
    logger.error(
      `Error getting tokens with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting tokens data`);
  }
};

const saveCustomerSupportLog = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    logger.info(`saveCustomerSupportLog with data: ${JSON.stringify(data)}`);

    const [logID] = await db("customer_support_logs").insert(data);

    const response = logID
      ? (await getCustomerSupportLogByField({"customer_support_logs.id": logID,}))[0]
      : false;
    logger.info(
      `saveCustomerSupportLog response data: ${JSON.stringify(response)}`
    );

    return response;
  } catch (e) {
    logger.error(
      `Error saving customer support log with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving customer support log`);
  }
};

const getCustomerSupportLogByField = async (data, isRaw = false) => {
  try {
    const query = db("customer_support_logs");

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
  } catch (e) {
    logger.error(
      `Error getting customer support logs with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting customer support logs data`);
  }
};

const updateCustomerSupportLog = async (where, data) => {
  try {
    if (data.metadata) {
      data.metadata = JSON.stringify(data.metadata);
    }

    logger.info(`updateCustomerSupportLog with data: ${JSON.stringify(data)}`);

    return await db("customer_support_logs").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating customer support log with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error updating customer support log: ${error}`);
  }
};

const getUtilsByField = async (data, isRaw = false, rawSelect = ``) => {
  try {
    const query = db("utils");

    if (rawSelect.trim() !== ``) {
      query.select(db.raw(rawSelect));
    }

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
  } catch (e) {
    logger.error(
      `Error getting utils with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting utils`);
  }
};

module.exports = {
  insertCronQueue,
  getCronQueueByField,
  updateCronQueueStatus,
  getCountriesByField,
  getTokenByField,
  saveToken,
  updateToken,
  getCurrenciesByField,
  saveCustomerSupportLog,
  getCustomerSupportLogByField,
  updateCustomerSupportLog,
  getUtilsByField,
  customQuery
};
