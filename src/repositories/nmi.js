const db = require("../utils/db");
const logger = require("../utils/logger");

const getNmiSubscriptionByField = async (where, isRaw = false) => {
  try {
    const query = db("payments_subscriptions");

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
  } catch (error) {
    logger.error(error);
  }
};

const listNmiSubscriptionByField = async (where, isRaw = false) => {
  try {
    const query = db("payments")
      .select("payments_subscriptions.*")
      .join("payments_subscriptions", "payments.uuid_unique", "payments_subscriptions.payment_id")

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
  } catch (error) {
    logger.error(error);
  }
};

const saveNmiSubscription = async (data) => {
  try {
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    logger.info(`Save Company Nmi Subscription with data: ${JSON.stringify(data)}`);

    const [subscriptionId] = await db("payments_subscriptions").insert(data);

    const response = subscriptionId
      ? (await getNmiSubscriptionByField({ "payments_subscriptions.id": subscriptionId }))[0]
      : false;

    logger.info(`Save Company Nmi Subscription response data: ${JSON.stringify(response)}`);

    return response;
  } catch (error) {
    logger.error(error);
  }
};

module.exports = {
  getNmiSubscriptionByField,
  listNmiSubscriptionByField,
  saveNmiSubscription,
}