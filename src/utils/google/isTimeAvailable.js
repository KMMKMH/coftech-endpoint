const dayjs = require("dayjs");
const logger = require("../logger");

const isTimeAvailable = async (dateTime, busyRanges, durationMinutes = 45) => {
  logger.info(`[isTimeAvailable] Checking availability for ${dateTime} with ${durationMinutes}min duration against ${busyRanges.length} busy ranges`);

  const startTime = dayjs(dateTime).second(0).millisecond(0);
  const endTime = startTime.add(durationMinutes, "minute");
  logger.info(`[isTimeAvailable] Time slot: ${startTime.format()} to ${endTime.format()}`);

  for (const range of busyRanges) {
    const busyStart = dayjs(range.start);
    const busyEnd = dayjs(range.end);
    logger.info(`[isTimeAvailable] Checking against busy range: ${busyStart.format()} to ${busyEnd.format()}`);

    if (startTime.isBefore(busyEnd) && endTime.isAfter(busyStart)) {
      logger.info(`[isTimeAvailable] Time slot conflicts with busy range - not available`);
      return false;
    }
  }

  logger.info(`[isTimeAvailable] No conflicts found - time is available`);
  return true;
};

module.exports = { isTimeAvailable };
