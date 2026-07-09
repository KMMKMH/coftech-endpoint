const logger = require("../../logger");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

const { isValidNumber } = require("libphonenumber-js");
const { google } = require("googleapis");
const { getGoogleClientByBot } = require("../../google/GoogleClient");
const { setGoogleCredencials } = require("../../google/setGoogleCredentials");
const { getTimeZoneGoogle } = require("../../google/getTimeZoneGoogle");
const { getEventsByField } = require("../../google/getEventsByField");
const { sendMessageBot } = require("../../../models/bots");
const { sendDataToInstance } = require("../../sendDataToInstance");

const repoCompany = require("../../../repositories/company");
const repoBots = require("../../../repositories/bots");
const { socialContactsRepository } = require("../../../repositories/social");
const repoAWS = require("../../../repositories/aws");
const repoBooking = require("../../../repositories/booking");
const { BOT_EVENTS } = require("../utils/../../events");
const createBotQueue = require("../../../utils/rabbit/createBotQueue");

dayjs.extend(utc);
dayjs.extend(timezone);

const executeReminderBooking = async (data) => {
  try {
    const { company_id: companyID, bot_id: botID } = data;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ID ${companyID} not found.`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot ID ${botID} not found.`);
    }

    const [googleCalendarStatusField] =
      await repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "GOOGLE_CALENDAR_STATUS",
      });

    if (
      !googleCalendarStatusField ||
      googleCalendarStatusField.data != "true"
    ) {
      throw new Error(
        `Google Calendar is not enabled for company ${companyID}.`
      );
    }

    const [googleCalendarReminderInterval] =
      await repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "GOOGLE_CALENDAR_REMINDER_INTERVAL",
      });
    if (
      !googleCalendarReminderInterval ||
      googleCalendarReminderInterval.data == ""
    ) {
      throw new Error(
        `Google Calendar Reminder Interval not found for company ${companyID}.`
      );
    }

    const { data: reminderInterval } = googleCalendarReminderInterval;

    const [hours, minutes] = reminderInterval.split(":").map(Number);
    const reminderIntervalInHours = hours + minutes / 60;
    const oAuth2Client = await getGoogleClientByBot(botID);

    await setGoogleCredencials(botID);

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const timezone = await getTimeZoneGoogle(calendar);

    const contactList = await getAllContacts(botID, botField.identifier);

    await processReminderBooking({
      botID,
      companyID,
      timezone,
      reminderIntervalInHours,
      contactList,
      calendar,
    });
  } catch (error) {
    logger.error(`Error in executeReminderBooking: ${error}`);
    throw new Error(error);
  }
};

const getAllContacts = async (botID, botPhone) => {
  let page = 1;
  let contacts = [];

  try {
    let moreContactsAvailable = true;

    while (moreContactsAvailable) {
      const { result: contactField, totalPages } =
        await socialContactsRepository.getContactsByBot(
          { botID, botPhone },
          500,
          page
        );

      const validContacts = contactField.flatMap((contact) => {
        if (isValidNumber(`+${contact.contact_id}`)) {
          return { contactID: contact.uuid_unique, phone: contact.contact_id };
        }
        return [];
      });

      contacts.push(...validContacts);

      moreContactsAvailable = page < totalPages;

      if (moreContactsAvailable) {
        page++;
      }
    }

    return contacts;
  } catch (error) {
    console.error(
      `Error fetching contacts for botID ${botID} and botPhone ${botPhone}:`,
      error
    );
    throw new Error(error);
  }
};

const processReminderBooking = async (data) => {
  try {
    const {
      botID,
      companyID,
      timezone,
      calendar,
      reminderIntervalInHours,
      contactList,
    } = data;

    const eventsList = [];

    for (const contact of contactList) {
      const { phone, contactID } = contact;

      const { userEvents, userEmail } = await getEventsByField({
        phone,
        calendar,
        timezone,
      });

      if (userEvents.length > 0) {
        eventsList.push({ contactID, phone, userEvents, userEmail });
      }
    }

    eventsList.map((event) => {
      const { contactID, phone, userEvents, userEmail } = event;

      userEvents.map(async (item) => {
        const now = dayjs().tz(timezone);
        const start = dayjs(item.startTime).tz(timezone);
        const end = dayjs(item.endTime).tz(timezone);

        const dateEvent = start.format("YYYY-MM-DD HH:mm");
        const endDateEvent = end.format("YYYY-MM-DD HH:mm");

        let bookinData = {};
        if (start.isSame(now, "day")) {
          bookinData.dayEvent = "today";
        } else if (start.isSame(now.add(1, "day"), "day")) {
          bookinData.dayEvent = "tomorrow";
        } else {
          bookinData.dayEvent = `on ${start.format("dddd")}`;
        }

        bookinData.hourEvent = start.format("HH:mm");

        const [existReminderBooking] =
          await repoBooking.getReminderBookingByField({
            "booking_reminders.contact_id": contactID,
            "booking_reminders.reminder_id": item.id,
          });

        const reminderIntervalInDays = reminderIntervalInHours / 24;
        const diffInDays = start.diff(now, "day", true);

        const isWithinRange =
          Math.abs(diffInDays - reminderIntervalInDays) <=
          reminderIntervalInDays;

        const hasEventPassed = start.isBefore(now);

        if (isWithinRange && !existReminderBooking && !hasEventPassed) {
          const { dayEvent, hourEvent } = bookinData;
          const capitalizeDayBooking =
            dayEvent.charAt(0).toUpperCase() + dayEvent.slice(1);
          const message = `Appointment Reminder\n\n${capitalizeDayBooking} at ${hourEvent} hrs.\n\nPlease confirm your attendance by replying to this message:\n- Yes - to confirm\n- No - if you need to cancel or reschedule\n\nIf we do not receive a response within the next 15 minutes, we will consider the appointment confirmed.`;

          await sendMessageBot({ botID }, { message, phone });

          const [instanceBotField] = await repoAWS.getInstanceBotsByField({
            "aws_instances_bots.bot_id": botID,
          });
          if (!instanceBotField) {
            throw new Error(`Bot with ID ${botID} does not have an instance.`);
          }

          const functionArgs = {
            dateTime: item.startTime,
            fullName: null,
            userConfirmed: false,
            userWantsCancel: false,
            userWantsReschedule: false,
            userWantsList: false,
            isReminder: true,
            email: userEmail,
          };

          const botQueue = createBotQueue(botID);
          await sendDataToInstance(
            botQueue,
            BOT_EVENTS.SAVE_MESSAGE_HISTORY,
            {
              bot_id: botID,
              message,
              message_type: "chat",
              chat_id: phone,
              messageTool: {
                functionArgs,
                functionName: "handleGoogleCalendar",
              },
              isMessageToHistory: true,
            }
          );

          const [reminderBookingStatusField] =
            await repoBooking.getReminderBookingStatusByField({
              "booking_reminders_status.name": "pending",
            });
          if (!reminderBookingStatusField) {
            throw new Error(`Reminder Booking Status not found.`);
          }

          const [GoogleSourceField] =
            await repoBooking.getBookingSourcesByField({
              "booking_sources.key": "google_calendar",
            });
          if (!GoogleSourceField) {
            throw new Error(`Google Source not found.`);
          }
          const { uuid_unique: GoogleSourceID } = GoogleSourceField;
          const { uuid_unique: reminderBookingStatusID } =
            reminderBookingStatusField;

          await repoBooking.saveReminderBooking({
            "booking_reminders.bot_id": botID,
            "booking_reminders.company_id": companyID,
            "booking_reminders.contact_id": contactID,
            "booking_reminders.status": reminderBookingStatusID,
            "booking_reminders.reminder_id": item.id,
            "booking_reminders.start_datetime": dateEvent,
            "booking_reminders.end_datetime": endDateEvent,
            "booking_reminders.is_reminder_sent": true,
            "booking_reminders.source": GoogleSourceID,
            "booking_reminders.metadata": JSON.stringify({ event: item }),
          });
        }
      });
    });
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = { executeReminderBooking };
