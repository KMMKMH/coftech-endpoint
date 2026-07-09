const logger = require("../logger");

const getTimeZoneGoogle = async (calendar) => {
  logger.info(`[getTimeZoneGoogle] Getting timezone from Google Calendar settings`);
  try {
    const settingResult = await calendar.settings.get({
      setting: "timezone",
      alt: "json",
    });
    logger.info(`[getTimeZoneGoogle] Settings response status: ${settingResult.status}`);

    if (settingResult.status !== 200) {
      throw new Error("Error getting timezone");
    }

    const timezone = settingResult.data.value;
    logger.info(`[getTimeZoneGoogle] Retrieved timezone: ${timezone}`);
    return timezone;
  } catch (error) {
    logger.error(`[getTimeZoneGoogle] Error getting timezone: ${error.message}`);
    throw new Error(error);
  }
};

module.exports = { getTimeZoneGoogle };