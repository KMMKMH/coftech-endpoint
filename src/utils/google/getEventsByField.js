const dayjs = require("dayjs");

const { socialContactsRepository } = require("../../repositories/social");
const logger = require("../logger");

const getEventsByField = async (data) => {
  logger.info(
    `[getEventsByField] Getting events for phone: ${data.phone} in timezone: ${data.timezone}`
  );
  try {
    const { phone, calendar, timezone } = data;

    const {
      result: [contactField],
    } = await socialContactsRepository.getByField({
      "social_contacts.contact_id": phone,
    });
    logger.info(`[getEventsByField] Contact found: ${!!contactField}`);
    if (!contactField) {
      return false;
    }

    const { metadata } = contactField;
    logger.info(
      `[getEventsByField] Contact email: ${metadata?.email || "none"}`
    );

    if (metadata?.email) {
      const timeMin = dayjs().toISOString();
      logger.info(
        `[getEventsByField] Querying events from: ${timeMin} for email: ${metadata.email}`
      );

      const eventsList = await calendar.events.list({
        calendarId: "primary",
        timeMin: timeMin,
        timeZone: timezone,
        orderBy: "startTime",
        singleEvents: true,
        q: metadata.email,
      });
      logger.info(
        `[getEventsByField] Events list response status: ${eventsList.status}`
      );

      if (eventsList.status !== 200) {
        throw new Error("Error getting events list");
      }

      const { items } = eventsList.data;
      logger.info(`[getEventsByField] Found ${items.length} events`);

      if (items.length > 0) {
        let userEvents = items.map((event) => {
          const { start, end, id } = event;
          return {
            id,
            startTime: start.dateTime,
            endTime: end.dateTime,
          };
        });
        logger.info(
          `[getEventsByField] Returning ${userEvents.length} processed events for ${metadata.email}`
        );
        return { userEvents, userEmail: metadata.email, phone };
      } else {
        logger.info(`[getEventsByField] No events found for ${metadata.email}`);
        return { userEvents: [], userEmail: metadata.email, phone };
      }
    } else {
      logger.info(`[getEventsByField] No email found in contact metadata`);
      return { userEvents: [], userEmail: null, phone };
    }
  } catch (error) {
    logger.error(`[getEventsByField] Error getting events: ${error.message}`, {
      data,
    });
    throw new Error(error);
  }
};

module.exports = { getEventsByField };
