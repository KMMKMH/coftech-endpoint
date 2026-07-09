const db = require("../utils/db");
const logger = require("../utils/logger");

const getOrderByField = async (data, isRaw = false) => {
  try {
    const query = db("orders");

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
      `Error getting order with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting order data`);
  }
};
const saveOrder = async (data) => {
  try {
    logger.info(`saveOrder with data: ${JSON.stringify(data)}`);
    const [transaction_id] = await db("orders").insert(data);
    const response = transaction_id
      ? (await getOrderByField({ "orders.transaction_id": transaction_id }))[0]
      : false;
    logger.info(`saveOrder response data: ${JSON.stringify(response)}`);
    return response;
  } catch (e) {
    logger.error(
      `Error saving order with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving order`);
  }
};
const updateOrder = async (where, data) => {
  try {
    logger.info(
      `updateOrder where: ${JSON.stringify(where)} with data ${JSON.stringify(
        data
      )}`
    );
    return await db("orders").where(where).update(data);
  } catch (e) {
    logger.info(
      `Error updating order with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating order`);
  }
};

module.exports = {
  getOrderByField,
  saveOrder,
  updateOrder,
};
