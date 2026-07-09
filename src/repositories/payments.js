const logger = require("../utils/logger");
const db = require("../utils/db");

const savePayments = async (data) => {
  try {
    logger.info(`Saving payment with data: ${JSON.stringify(data)}`);
    const [paymentResponseID] = await db("payments").insert(data);
    return paymentResponseID
      ? (await getPaymentsByField({ "payments.id": paymentResponseID }))[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving payment with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(error);
  }
};

const updatePayments = async (where, data) => {
  try {
    logger.info(
      `Updating payment with data: ${JSON.stringify(
        data
      )} and where: ${JSON.stringify(where)}`
    );
    return await db("payments").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating payment with data: ${JSON.stringify(
        data
      )} and where: ${JSON.stringify(where)}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

const getPaymentsByField = async (data, isRaw = false) => {
  try {
    const query = db("payments")
      .select("payments.*")
      .select("payments_status.name AS status_name")
      .leftJoin(
        "payments_status",
        "payments_status.uuid_unique",
        "payments.status"
      );

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
      `Error getting payment  with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(`Error getting payment`);
  }
};

const getLastPaymentsByField = async (data, isRaw = false) => {
  try {
    const query = db("payments")
      .select("payments.*")
      .select("payments_status.name AS status_name")
      .leftJoin(
        "payments_status",
        "payments_status.uuid_unique",
        "payments.status"
      );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    query.orderBy("created_at", "desc");

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting payment  with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(`Error getting payment`);
  }
};

const getPaymentsProviderByField = async (data, isRaw = false) => {
  try {
    const query = db("payments_provider");

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
      `Error getting payment provider with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

const getPaymentsTypeByField = async (data, isRaw = false) => {
  try {
    const query = db("payments_type");

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
      `Error getting payment type with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
  }
};

const getPaymentsStatus = async (data, isRaw = false) => {
  try {
    const query = db("payments_status");

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
      `Error getting payment status with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
  }
};

const savePaymentAuthCode = async (data) => {
  try {
    logger.info(`Saving payment auth code with data: ${JSON.stringify(data)}`);
    const [paymentAuthCodeID] = await db("payment_auth_codes").insert(data);

    return paymentAuthCodeID
      ? (await getPaymentAuthCodeByField({"payment_auth_codes.id": paymentAuthCodeID,}))[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving payment auth code with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

const getPaymentAuthCodeByField = async (data, isRaw = false) => {
  try {
    const query = db("payment_auth_codes");

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
      `Error getting payment auth code with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
  }
};

const updatePaymentAuthCodeStatus = async (id, status) => {
  try {
    logger.info(`Updating payment auth code status for id ${id} to ${status}`);

    return await db("payment_auth_codes")
      .where({ uuid_unique: id })
      .update({ status });
  } catch (error) {
    logger.error(
      `Error updating payment auth code with id: ${JSON.stringify(
        id
      )} and status ${JSON.stringify(status)}, error: ${error.message}`
    );
  }
};
const getPaymentsLogsByField = async (data, isRaw = false) => {
  try {
    const query = db("payments_logs");

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
      `Error getting payment log with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(error);
  }
};

const savePaymentsLogs = async (data) => {
  try {
    logger.info(`Saving payment logs with data: ${JSON.stringify(data)}`);
    const [paymentLogID] = await db("payments_logs").insert(data);
    return paymentLogID
      ? (await getPaymentsLogsByField({ "payments_logs.id": paymentLogID }))[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving payment logs with data: ${JSON.stringify(data)}`,
      error.message
    );
    throw new Error(error);
  }
};

const getPaymentsQueueByField = async (data, isRaw = false) => {
  try {
    const query = db("payments_queue");

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
      `Error getting payment queue with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(error);
  }
};

const savePaymentsQueue = async (data) => {
  try {
    logger.info(`Saving payment queue with data: ${JSON.stringify(data)}`);
    const [paymentQueueID] = await db("payments_queue").insert(data);
    return paymentQueueID
      ? (await getPaymentsQueueByField({ "payments_queue.id": paymentQueueID }))[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving payment queue with data: ${JSON.stringify(data)}`,
      error.message
    );
    throw new Error(error);
  }
};

const updatePaymentsQueue = async (where, data) => {
  try {
    logger.info(
      `Updating payment queue with data: ${JSON.stringify(
        data
      )} and where: ${JSON.stringify(where)}`
    );
    return await db("payments_queue").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating payment queue with data: ${JSON.stringify(
        data
      )} and where: ${JSON.stringify(where)}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

module.exports = {
  savePayments,
  getPaymentsByField,
  getLastPaymentsByField,
  getPaymentsProviderByField,
  getPaymentsTypeByField,
  getPaymentsStatus,
  savePaymentAuthCode,
  getPaymentAuthCodeByField,
  updatePaymentAuthCodeStatus,
  updatePayments,
  savePaymentsLogs,
  getPaymentsLogsByField,
  getPaymentsQueueByField,
  savePaymentsQueue,
  updatePaymentsQueue,
};
