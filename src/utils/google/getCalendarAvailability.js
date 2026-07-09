const dayjs = require("dayjs");
const { isTimeAvailable } = require("./isTimeAvailable");
const logger = require("../logger");

const getCalendarAvailability = async (data) => {
  logger.info(`[getCalendarAvailability] Checking availability for dateTime: ${data.dateTime} in timezone: ${data.timezone}`);
  try {
    const { calendar, timezone, dateTime } = data;

    const timeMin = dayjs(dateTime).tz(timezone).toISOString();
    const timeMax = dayjs(dateTime).tz(timezone).add(1, "days").toISOString();
    logger.info(`[getCalendarAvailability] Query range - timeMin: ${timeMin}, timeMax: ${timeMax}`);

    const freebusyResult = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin,
        timeZone: timezone,
        timeMax: timeMax,
        items: [{ id: "primary" }],
      },
    });
    logger.info(`[getCalendarAvailability] Freebusy query response status: ${freebusyResult.status}`);

    if (freebusyResult.status !== 200) {
      throw new Error("Error getting freebusy");
    }

    const { busy } = freebusyResult.data.calendars.primary;
    logger.info(`[getCalendarAvailability] Found ${busy.length} busy periods`);

    const isAvailable = await isTimeAvailable(dateTime, busy);
    logger.info(`[getCalendarAvailability] Time availability result: ${isAvailable}`);
    return isAvailable;
  } catch (error) {
    logger.error(`[getCalendarAvailability] Error checking availability: ${error.message}`, { data });
    throw new Error(error);
  }
};

module.exports = { getCalendarAvailability };
