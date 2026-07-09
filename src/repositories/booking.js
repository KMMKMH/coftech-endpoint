const db = require("../utils/db");
const logger = require("../utils/logger");

const getReminderBookingByField = async (data, isRaw = false) => {
  try {
    const query = db("booking_reminders");

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
      `Error getting booking_reminders with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting booking_reminders data`);
  }
};

const saveReminderBooking = async (data) => {
  try {
    logger.info(`saveBotReminderBooking with data: ${JSON.stringify(data)}`);
    const [reminderBookingID] = await db("booking_reminders").insert(data);
    return await getReminderBookingByField({
      "booking_reminders.id": reminderBookingID,
    });
  } catch (e) {
    logger.error(
      `Error saving booking_reminders with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving booking_reminders: ${e}`);
  }
};

const updateReminderBooking = async (where, data) => {
  try {
    logger.info(
      `updateBotReminderBooking where: ${JSON.stringify(
        where
      )} with data: ${JSON.stringify(data)}`
    );
    return await db("booking_reminders").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating booking_reminders with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error updating booking_reminders`);
  }
};

const getReminderBookingStatusByField = async (data, isRaw = false) => {
  try {
    const query = db("booking_reminders_status");

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
      `Error getting booking_reminders_status with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting booking_reminders_status data`);
  }
};

const getBookingSourcesByField = async (data, isRaw = false) => {
  try {
    const query = db("booking_sources");

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
      `Error getting booking_sources with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting booking_sources data`);
  }
};

module.exports = {
  getReminderBookingByField,
  saveReminderBooking,
  updateReminderBooking,
  getReminderBookingStatusByField,
  getBookingSourcesByField,
};
