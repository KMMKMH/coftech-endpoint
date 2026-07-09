const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const { google } = require("googleapis");
const { getGoogleClientByBot } = require("../utils/google/GoogleClient");
const {
  setGoogleCredencials,
} = require("../utils/google/setGoogleCredentials");
const { getTimeZoneGoogle } = require("../utils/google/getTimeZoneGoogle");
const { sendDataToInstance } = require("../utils/sendDataToInstance");
const { checkContactEmail } = require("../models/social");
const { getEventsByField } = require("../utils/google/getEventsByField");
const {
  getCalendarAvailability,
} = require("../utils/google/getCalendarAvailability");

const repoBots = require("../repositories/bots");
const repoGoogle = require("../repositories/google");
const repoAWS = require("../repositories/aws");
const repoCompany = require("../repositories/company");
const { socialContactsRepository } = require("../repositories/social");
const repoBooking = require("../repositories/booking");

const modelsBots = require("../models/bots");
const { handleGaxiosError } = require("../utils/google/handleGaxiosError");
const { BOT_EVENTS } = require("../utils/events");
const logger = require("../utils/logger");
const createBotQueue = require("../utils/rabbit/createBotQueue");

dayjs.extend(utc);
dayjs.extend(timezone);

const googleAuth = async (query) => {
  logger.info(`[googleAuth] Starting Google auth process`, { query });
  try {
    if (query.error) {
      throw new Error(query.error);
    }

    const { state: botID, code } = query;
    logger.info(`[googleAuth] Extracted botID and code`, {
      botID,
      codeLength: code?.length,
    });

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    logger.info(`[googleAuth] Bot field lookup result`, {
      botFound: !!botField,
    });
    if (!botField) {
      throw new Error(`Bot ID ${botID} not found.`);
    }

    const [existingRefreshToken] = await repoBots.getBotsRefreshTokenByField({
      "bots_refresh_tokens.bot_id": botID,
    });
    logger.info(`[googleAuth] Refresh token check`, {
      hasExistingToken: !!existingRefreshToken,
    });
    if (existingRefreshToken) {
      throw new Error(`Bot ID ${botID} already has a google auth`);
    }

    const oAuth2Client = await getGoogleClientByBot(botID);

    const { tokens } = await oAuth2Client.getToken(code);
    logger.info(`[googleAuth] Tokens received`, {
      hasTokens: !!tokens,
      hasRefreshToken: !!tokens?.refresh_token,
    });
    if (!tokens) {
      throw new Error("Error getting tokens");
    }

    oAuth2Client.setCredentials(tokens);

    await repoBots.saveBotsRefreshToken({
      "bots_refresh_tokens.bot_id": botID,
      "bots_refresh_tokens.refresh_token": tokens.refresh_token,
      "bots_refresh_tokens.credentials": tokens,
    });
    logger.info(`[googleAuth] Auth completed successfully`, { botID });

    return true;
  } catch (error) {
    logger.error(`[googleAuth] Error during auth process`, {
      error: error.message,
      query,
    });
    throw new Error(error);
  }
};

const generateAuthUrl = async (query) => {
  logger.info(`[generateAuthUrl] Generating auth URL`, { query });
  try {
    const { googleScopeID, botID } = query;
    logger.info(`[generateAuthUrl] Extracted parameters`, {
      googleScopeID,
      botID,
    });

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    logger.info(`[generateAuthUrl] Bot lookup result`, {
      botFound: !!botField,
    });
    if (!botField) {
      throw new Error(`Bot ID ${botID} not found.`);
    }

    const [googleScopeField] = await repoGoogle.getScopesByField({
      "google_scopes.uuid_unique": googleScopeID,
    });
    logger.info(`[generateAuthUrl] Google scope lookup result`, {
      scopeFound: !!googleScopeField,
    });
    if (!googleScopeField) {
      throw new Error(`Google Scope ID ${googleScopeID} not found.`);
    }

    const { scope } = googleScopeField;
    logger.info(`[generateAuthUrl] Using scope`, { scope });
    const oAuth2Client = await getGoogleClientByBot(botID);

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      state: botID,
      scope: scope,
      prompt: "consent",
      include_granted_scopes: true,
    });
    logger.info(`[generateAuthUrl] Auth URL generated successfully`, {
      botID,
      authUrlLength: authUrl.length,
    });
    return authUrl;
  } catch (error) {
    logger.error(`[generateAuthUrl] Error generating auth URL`, {
      error: error.message,
      query,
    });
    throw new Error(error);
  }
};

const revokeAuth = async (query) => {
  logger.info(`[revokeAuth] Starting auth revocation`, { query });
  try {
    const { botID } = query;
    logger.info(`[revokeAuth] Extracted botID: ${botID}`);

    const oAuth2Client = await setGoogleCredencials(botID);

    const [botRefreshTokenField] = await repoBots.getBotsRefreshTokenByField({
      "bots_refresh_tokens.bot_id": botID,
    });
    logger.info(`[revokeAuth] Refresh token found: ${!!botRefreshTokenField}`);
    if (!botRefreshTokenField) {
      throw new Error(`Refresh Token not found for Bot ID ${botID}.`);
    }

    const { credentials } = botRefreshTokenField;
    const { access_token } = credentials;
    logger.info(`[revokeAuth] Has access token: ${!!access_token}`);

    const response = await oAuth2Client.revokeToken(access_token);
    logger.info(`[revokeAuth] Revoke response status: ${response.status}`);
    if (response.status !== 200) {
      throw new Error("Error revoking token");
    }

    const deleteResult = await repoBots.deleteBotsRefreshToken({
      "bots_refresh_tokens.bot_id": botID,
    });
    logger.info(`[revokeAuth] Auth revocation completed for bot: ${botID}`);
    return deleteResult;
  } catch (error) {
    logger.error(
      `[revokeAuth] Error during auth revocation: ${error.message}`,
      { query }
    );
    await handleGaxiosError(error);
    throw new Error(error);
  }
};

const getAuthState = async (query) => {
  logger.info(`[getAuthState] Checking auth state`, { query });
  try {
    const { botID } = query;
    logger.info(`[getAuthState] Checking auth for bot: ${botID}`);

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    logger.info(`[getAuthState] Bot found: ${!!botField}`);
    if (!botField) {
      throw new Error(`Bot ID ${botID} not found.`);
    }

    const [botRefreshTokenField] = await repoBots.getBotsRefreshTokenByField({
      "bots_refresh_tokens.bot_id": botID,
    });
    logger.info(
      `[getAuthState] Refresh token found: ${!!botRefreshTokenField}`
    );
    if (!botRefreshTokenField) {
      throw new Error(`Bot ID ${botID} does not have a google auth.`);
    }

    logger.info(`[getAuthState] Auth state confirmed for bot: ${botID}`);
    return true;
  } catch (error) {
    logger.error(`[getAuthState] Error checking auth state: ${error.message}`, {
      query,
    });
    await handleGaxiosError(error);
    throw new Error(error);
  }
};

const getAvailableCalendarEvent = async (data) => {
  logger.info(`[getAvailableCalendarEvent] Checking calendar availability`, {
    data,
  });
  try {
    let message = "";

    let { bot_id: botID, dateTime, phone, functionArgs, functionName } = data;
    logger.info(
      `[getAvailableCalendarEvent] Processing request for bot: ${botID}, phone: ${phone}, dateTime: ${dateTime}`
    );

    const oAuth2Client = await setGoogleCredencials(botID);

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const timezone = await getTimeZoneGoogle(calendar);
    logger.info(`[getAvailableCalendarEvent] Using timezone: ${timezone}`);

    const parsedDateTime = dayjs.tz(dateTime, timezone);
    logger.info(
      `[getAvailableCalendarEvent] Parsed datetime: ${parsedDateTime.format()}`
    );

    const messageAvailable = `I have availability to schedule an appointment on *${parsedDateTime.format("DD/MM/YYYY")}* at *${parsedDateTime.format("HH:mm")}* hours. Would you like to schedule it?`;

    const messageNotAvailable = `Sorry, I do not have availability to schedule an appointment on *${parsedDateTime.format("DD/MM/YYYY")}* at *${parsedDateTime.format("HH:mm")}* hours. What other time would you like to schedule?`;

    const { userEvents, userEmail } = await getEventsByField({
      phone,
      calendar,
      timezone,
    });
    logger.info(
      `[getAvailableCalendarEvent] Found ${userEvents.length} user events, userEmail: ${userEmail}`
    );

    let functionArgsWithNewEmail = functionArgs;
    if (userEmail) {
      if (!Object.hasOwnProperty.call(functionArgsWithNewEmail, "email")) {
        functionArgsWithNewEmail = {
          ...functionArgsWithNewEmail,
          email: userEmail,
        };
      } else {
        functionArgsWithNewEmail.email = userEmail;
      }
      logger.info(
        `[getAvailableCalendarEvent] Updated function args with email: ${userEmail}`
      );
    }

    const [repeatAppointmentConfigField] =
      await repoCompany.getCompanyConfigByField({
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "GOOGLE_CALENDAR_REPEAT_APPOINTMENT",
      });
    logger.info(
      `[getAvailableCalendarEvent] Repeat appointment config: ${repeatAppointmentConfigField?.data}`
    );

    if (
      userEvents.length > 0 &&
      repeatAppointmentConfigField?.data === "false"
    ) {
      const { startTime } = userEvents[0];
      const eventDate = dayjs(startTime).tz(timezone);
      message = `You already have an appointment scheduled on *${eventDate.format("DD/MM/YYYY")}* at *${eventDate.format("HH:mm")} hours.* Would you like to reschedule or cancel it?`;
      logger.info(
        `[getAvailableCalendarEvent] User has existing appointment, showing reschedule message`
      );
    } else {
      const isAvailable = await getCalendarAvailability({
        calendar,
        timezone,
        dateTime: parsedDateTime.toISOString(),
      });
      logger.info(
        `[getAvailableCalendarEvent] Calendar availability check result: ${isAvailable}`
      );
      message = isAvailable ? messageAvailable : messageNotAvailable;
    }

    await modelsBots.sendMessageBot({ botID }, { message, phone });
    logger.info(`[getAvailableCalendarEvent] Message sent to bot: ${botID}`);

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${botID} does not have an instance.`);
    }

    const { instance_name: instanceID } = instanceBotField;
    logger.info(`[getAvailableCalendarEvent] Using instance: ${instanceID}`);

    const botQueue = createBotQueue(botID);
    await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_MESSAGE_HISTORY, {
      bot_id: botID,
      message,
      message_type: "chat",
      chat_id: phone,
      messageTool: { functionArgs: functionArgsWithNewEmail, functionName },
      isMessageToHistory: true,
    });
    logger.info(
      `[getAvailableCalendarEvent] Process completed successfully for bot: ${botID}`
    );
  } catch (error) {
    logger.error(
      `[getAvailableCalendarEvent] Error processing request: ${error.message}`,
      { data }
    );
    await handleGaxiosError(error);
    throw new Error(error);
  }
};

const createCalendarEvent = async (data) => {
  logger.info(`[createCalendarEvent] Creating calendar event`, { data });
  try {
    const {
      bot_id: botID,
      dateTime,
      fullName,
      email,
      phone,

      functionArgs,
      functionName,
    } = data;
    logger.info(
      `[createCalendarEvent] Processing for bot: ${botID}, user: ${fullName}, dateTime: ${dateTime}`
    );

    const { summary, description, appointmentDuration } = functionArgs;
    logger.info(
      `[createCalendarEvent] Event details - summary: ${summary}, duration: ${appointmentDuration}`
    );

    let message = "";

    const {
      message: messageError,
      emailRequired,
      emailValid,
      userEmail,
    } = await checkContactEmail(phone, email);
    logger.info(
      `[createCalendarEvent] Email validation - required: ${emailRequired}, valid: ${emailValid}, userEmail: ${userEmail}`
    );

    if (emailRequired || !emailValid) {
      logger.info(
        `[createCalendarEvent] Email validation failed, sending error message`
      );
      await modelsBots.sendMessageBot(
        { botID },
        { message: messageError, phone }
      );
      return;
    }

    const oAuth2Client = await setGoogleCredencials(botID);

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const timezone = await getTimeZoneGoogle(calendar);
    logger.info(`[createCalendarEvent] Using timezone: ${timezone}`);

    const parsedDateTime = dayjs.tz(dateTime, timezone);
    logger.info(
      `[createCalendarEvent] Parsed datetime: ${parsedDateTime.format()}`
    );

    const isAvailable = await getCalendarAvailability({
      calendar,
      timezone,
      dateTime: parsedDateTime.toISOString(),
    });
    logger.info(`[createCalendarEvent] Calendar availability: ${isAvailable}`);

    const { userEvents } = await getEventsByField({
      phone,
      calendar,
      timezone,
    });
    logger.info(
      `[createCalendarEvent] Found ${userEvents.length} existing user events`
    );

    const [appointmentDurationHours, appointmentDurationMinutes] =
      appointmentDuration.split(":").map(Number);
    logger.info(
      `[createCalendarEvent] Duration parsed - ${appointmentDurationHours}h ${appointmentDurationMinutes}m`
    );

    const [repeatAppointmentConfigField] =
      await repoCompany.getCompanyConfigByField({
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "GOOGLE_CALENDAR_REPEAT_APPOINTMENT",
      });
    logger.info(
      `[createCalendarEvent] Repeat appointment config: ${repeatAppointmentConfigField?.data}`
    );

    if (
      userEvents.length > 0 &&
      repeatAppointmentConfigField?.data === "false"
    ) {
      const { startTime } = userEvents[0];

      const eventDate = dayjs(startTime).tz(timezone);
      message = `You already have an appointment scheduled on *${eventDate.format("DD/MM/YYYY")}* at *${eventDate.format("HH:mm")} hours.* Would you like to reschedule or cancel it?`;
      logger.info(
        `[createCalendarEvent] User has existing appointment, showing reschedule message`
      );
    } else if (!isAvailable) {
      message =
        "Sorry, the selected time is no longer available. Please choose another time.";
      logger.info(
        `[createCalendarEvent] Time slot not available, showing unavailable message`
      );
    } else {
      logger.info(`[createCalendarEvent] Creating new calendar event`);
      const eventResponse = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: summary || "Appointment with " + fullName,
          description: description || "Appointment with " + fullName,
          start: {
            dateTime: parsedDateTime.format(),
            timeZone: timezone,
          },
          end: {
            dateTime: parsedDateTime
              .add(appointmentDurationHours, "hour")
              .add(appointmentDurationMinutes, "minute")
              .format(),
            timeZone: timezone,
          },
          attendees: [{ email: userEmail }],
        },
      });
      logger.info(
        `[createCalendarEvent] Event creation response status: ${eventResponse.status}`
      );

      if (eventResponse.status !== 200) {
        throw new Error("Error saving event");
      }

      message = `Your appointment has been successfully scheduled for *${parsedDateTime.format("DD/MM/YYYY")}* at *${parsedDateTime.format("HH:mm")} hours.* If you need more information or want to make any changes, feel free to contact us. Thank you!`;
      logger.info(
        `[createCalendarEvent] Event created successfully for ${fullName} at ${parsedDateTime.format()}`
      );
    }

    await modelsBots.sendMessageBot({ botID }, { message, phone });
    logger.info(`[createCalendarEvent] Message sent to bot: ${botID}`);

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${botID} does not have an instance.`);
    }

    const { instance_name: instanceID } = instanceBotField;
    logger.info(`[createCalendarEvent] Using instance: ${instanceID}`);

    const botQueue = createBotQueue(botID);
    await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_MESSAGE_HISTORY, {
      bot_id: botID,
      message,
      message_type: "chat",
      chat_id: phone,
      messageTool: { functionArgs, functionName },
      isMessageToHistory: true,
    });
    logger.info(
      `[createCalendarEvent] Process completed successfully for bot: ${botID}`
    );
  } catch (error) {
    logger.error(
      `[createCalendarEvent] Error creating calendar event: ${error.message}`,
      { data }
    );
    await handleGaxiosError(error);
    throw new Error(error);
  }
};

const updateCalendarEvent = async (data) => {
  logger.info(`[updateCalendarEvent] Updating calendar event`, { data });
  try {
    let message =
      "Sorry, you do not have a scheduled appointment to reschedule.";

    let {
      bot_id: botID,
      dateTime,
      phone,
      newDateTime,
      appointmentDuration,
      functionArgs,
      functionName,
    } = data;
    logger.info(
      `[updateCalendarEvent] Processing update for bot: ${botID}, phone: ${phone}, oldTime: ${dateTime}, newTime: ${newDateTime}`
    );

    const oAuth2Client = await setGoogleCredencials(botID);

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const timezone = await getTimeZoneGoogle(calendar);
    logger.info(`[updateCalendarEvent] Using timezone: ${timezone}`);

    let { userEvents } = await getEventsByField({ phone, calendar, timezone });
    logger.info(`[updateCalendarEvent] Found ${userEvents.length} user events`);

    const [appointmentDurationHours, appointmentDurationMinutes] =
      appointmentDuration.split(":").map(Number);
    logger.info(
      `[updateCalendarEvent] Duration: ${appointmentDurationHours}h ${appointmentDurationMinutes}m`
    );

    const [pendingStatusField] =
      await repoBooking.getReminderBookingStatusByField({
        "booking_reminders_status.name": "pending",
      });
    if (!pendingStatusField)
      throw new Error(`Status 'pending' was not found`);

    const [GoogleSourceField] = await repoBooking.getBookingSourcesByField({
      "booking_sources.key": "google_calendar",
    });
    if (!GoogleSourceField)
      throw new Error(`Source 'google_calendar' was not found`);

    const { uuid_unique: GoogleSourceID } = GoogleSourceField;
    const { uuid_unique: pendingStatusID } = pendingStatusField;
    logger.info(
      `[updateCalendarEvent] Got booking IDs - GoogleSource: ${GoogleSourceID}, PendingStatus: ${pendingStatusID}`
    );

    const [reminderBookingField] = await repoBooking.getReminderBookingByField({
      "booking_reminders.bot_id": botID,
      "booking_reminders.contact_id": phone,
      "booking_reminders.status": pendingStatusID,
      "booking_reminders.source": GoogleSourceID,
    });
    logger.info(
      `[updateCalendarEvent] Reminder booking found: ${!!reminderBookingField}`
    );

    if (reminderBookingField) {
      userEvents = await filterEventsByDateTime(
        userEvents,
        timezone,
        reminderBookingField.start_datetime
      );
      logger.info(
        `[updateCalendarEvent] Filtered events by reminder datetime, found: ${userEvents.length}`
      );
    } else {
      userEvents = await filterEventsByDateTime(userEvents, timezone, dateTime);
      logger.info(
        `[updateCalendarEvent] Filtered events by provided datetime, found: ${userEvents.length}`
      );
    }

    if (userEvents.length === 1) {
      const { id } = userEvents[0];
      const newDate = dayjs.tz(newDateTime, timezone);
      logger.info(
        `[updateCalendarEvent] Updating event ${id} to new time: ${newDate.format()}`
      );

      const eventResponse = await calendar.events.patch({
        calendarId: "primary",
        eventId: id,
        requestBody: {
          start: {
            dateTime: newDate.toISOString(),
            timeZone: timezone,
          },
          end: {
            dateTime: newDate
              .add(appointmentDurationHours, "hour")
              .add(appointmentDurationMinutes, "minute")
              .format(),
            timeZone: timezone,
          },
        },
      });
      logger.info(
        `[updateCalendarEvent] Update response status: ${eventResponse.status}`
      );

      if (eventResponse.status !== 200) {
        throw new Error("Error updating the event in Google Calendar");
      }

      message = `Your appointment has been successfully rescheduled for *${newDate.format("DD/MM/YYYY")}* at *${newDate.format("HH:mm")} hours.* If you need more information or want to make any changes, feel free to contact us. Thank you!`;
      logger.info(
        `[updateCalendarEvent] Event updated successfully to: ${newDate.format()}`
      );
    } else {
      logger.warn(
        `[updateCalendarEvent] No unique event found for rescheduling. Found ${userEvents.length} events`
      );
    }

    await modelsBots.sendMessageBot({ botID }, { message, phone });
    logger.info(`[updateCalendarEvent] Message sent to bot: ${botID}`);

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });
    if (!instanceBotField) {
      throw new Error(`Bot ID ${botID} does not have an assigned instance`);
    }

    const { instance_name: instanceID } = instanceBotField;
    logger.info(`[updateCalendarEvent] Using instance: ${instanceID}`);

    const botQueue = createBotQueue(botID);
    await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_MESSAGE_HISTORY, {
      bot_id: botID,
      message,
      message_type: "chat",
      chat_id: phone,
      messageTool: { functionArgs, functionName },
      isMessageToHistory: true,
    });

    await updateBotReminderBooking(data, "rescheduled");
    logger.info(
      `[updateCalendarEvent] Process completed successfully for bot: ${botID}`
    );
  } catch (error) {
    logger.error(
      `[updateCalendarEvent] Error updating calendar event: ${error.message}`,
      { data }
    );
    await handleGaxiosError(error);
    throw new Error(error);
  }
};

const deleteCalendarEvent = async (data) => {
  try {
    let message = "";

    let { bot_id: botID, dateTime, phone, functionArgs, functionName } = data;

    const oAuth2Client = await setGoogleCredencials(botID);

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const timezone = await getTimeZoneGoogle(calendar);

    const { userEvents } = await getEventsByField({
      phone,
      calendar,
      timezone,
    });

    if (userEvents.length > 1 && !dateTime) {
      const eventsText = userEvents.reduce((acc, event, index) => {
        const eventDate = dayjs(event.startTime).tz(timezone);
        const eventDateFormatted = eventDate.format("DD/MM/YYYY");
        const eventTimeFormatted = eventDate.format("HH:mm");
        return acc + `${index + 1}. *${eventDateFormatted}* at *${eventTimeFormatted} hours.*\n`;
      }, "");
      message = `You have the following scheduled appointments:\n${eventsText}\nWhich one would you like to cancel?`;
    } else if (!userEvents.length) {
      message =
        "Sorry, you do not have a scheduled appointment to cancel. Would you like to schedule one?";
    } else if (dateTime) {
      const eventToDelete = await filterEventsByDateTime(
        userEvents,
        timezone,
        dateTime
      );

      if (eventToDelete.length === 0) {
        message = "No appointment was found for the specified date and time.";
      } else {
        const eventResponse = await calendar.events.delete({
          calendarId: "primary",
          eventId: eventToDelete[0].id,
          sendNotifications: true,
        });

        if (eventResponse.status !== 204) {
          throw new Error("Error deleting event");
        }

        message = `Your appointment has been successfully canceled. If you need more information or want to make any changes, feel free to contact us. Thank you!`;
      }
    }

    await modelsBots.sendMessageBot({ botID }, { message, phone });

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${botID} does not have an instance.`);
    }

    const botQueue = createBotQueue(botID);
    await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_MESSAGE_HISTORY, {
      bot_id: botID,
      message,
      message_type: "chat",
      chat_id: phone,
      messageTool: { functionArgs, functionName },
      isMessageToHistory: true,
    });

    await updateBotReminderBooking(data, "cancelled");
  } catch (error) {
    await handleGaxiosError(error);
    throw new Error(error);
  }
};

const getCalendarEvent = async (data) => {
  logger.info(`[getCalendarEvent] Getting calendar events`, { data });
  try {
    let message =
      "Sorry, you do not have a scheduled appointment. Would you like to schedule one?";

    let { bot_id: botID, phone, functionArgs, functionName } = data;
    logger.info(
      `[getCalendarEvent] Processing request for bot: ${botID}, phone: ${phone}`
    );

    const oAuth2Client = await setGoogleCredencials(botID);

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const timezone = await getTimeZoneGoogle(calendar);
    logger.info(`[getCalendarEvent] Using timezone: ${timezone}`);

    const { userEvents, userEmail } = await getEventsByField({
      phone,
      calendar,
      timezone,
    });
    logger.info(
      `[getCalendarEvent] Found ${userEvents.length} events, userEmail: ${userEmail}`
    );

    functionArgs.email = userEmail;

    if (userEvents.length === 1) {
      const { startTime } = userEvents[0];
      const eventDate = dayjs(startTime).tz(timezone);

      message = `You have an appointment scheduled on *${eventDate.format(
        "DD/MM/YYYY"
      )}* at *${eventDate.format(
        "HH:mm"
      )} hours.* Would you like to reschedule or cancel it?`;
      logger.info(
        `[getCalendarEvent] Single event found at: ${eventDate.format()}`
      );
    } else if (userEvents.length > 1) {
      const eventsText = userEvents.reduce((acc, event, index) => {
        const eventDate = dayjs(event.startTime).tz(timezone);
        const eventDateFormatted = eventDate.format("DD/MM/YYYY");
        const eventTimeFormatted = eventDate.format("HH:mm");
        return acc + `${index + 1}. *${eventDateFormatted}* at *${eventTimeFormatted} hours.*\n`;
      }, "");

      message = `You have the following scheduled appointments:\n${eventsText}\nWould you like to reschedule or cancel any of them?`;
      logger.info(
        `[getCalendarEvent] Multiple events found: ${userEvents.length}`
      );
    } else {
      logger.info(
        `[getCalendarEvent] No events found, showing default message`
      );
    }

    await modelsBots.sendMessageBot({ botID }, { message, phone });
    logger.info(`[getCalendarEvent] Message sent to bot: ${botID}`);

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${botID} does not have an instance.`);
    }

    const { instance_name: instanceID } = instanceBotField;
    logger.info(`[getCalendarEvent] Using instance: ${instanceID}`);

    const botQueue = createBotQueue(botID);
    await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_MESSAGE_HISTORY, {
      bot_id: botID,
      message,
      message_type: "chat",
      chat_id: phone,
      messageTool: { functionArgs, functionName },
      isMessageToHistory: true,
    });
    logger.info(
      `[getCalendarEvent] Process completed successfully for bot: ${botID}`
    );
  } catch (error) {
    logger.error(
      `[getCalendarEvent] Error getting calendar events: ${error.message}`,
      { data }
    );
    await handleGaxiosError(error);
    throw new Error(error);
  }
};

const updateBotReminderBooking = async (data, statusName) => {
  logger.info(
    `[updateBotReminderBooking] Updating reminder booking to status: ${statusName}`,
    { data }
  );
  try {
    const { bot_id: botID, phone, dateTime } = data;
    logger.info(
      `[updateBotReminderBooking] Processing for bot: ${botID}, phone: ${phone}, dateTime: ${dateTime}`
    );

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    logger.info(`[updateBotReminderBooking] Bot found: ${!!botField}`);
    if (!botField) {
      throw new Error(`Bot ID ${botID} not found.`);
    }

    const [pendingStatusField] =
      await repoBooking.getReminderBookingStatusByField({
        "booking_reminders_status.name": "pending",
      });
    if (!pendingStatusField) {
      throw new Error(`Pending Status not found.`);
    }
    const { uuid_unique: pendingStatusID } = pendingStatusField;
    logger.info(
      `[updateBotReminderBooking] Pending status ID: ${pendingStatusID}`
    );

    const {
      result: [contactField],
    } = await socialContactsRepository.getByField({
      "social_contacts.contact_id": phone,
      "social_contacts.network_id": botField.network_id,
    });
    logger.info(`[updateBotReminderBooking] Contact found: ${!!contactField}`);
    if (!contactField) {
      throw new Error(`Contact not found.`);
    }
    const { uuid_unique: contactID } = contactField;
    logger.info(`[updateBotReminderBooking] Contact ID: ${contactID}`);

    const [reminderBookingField] = await repoBooking.getReminderBookingByField({
      "booking_reminders.bot_id": botID,
      "booking_reminders.contact_id": contactID,
      "booking_reminders.status": pendingStatusID,
    });
    logger.info(
      `[updateBotReminderBooking] Reminder booking found: ${!!reminderBookingField}`
    );
    if (!reminderBookingField) {
      throw new Error(`Reminder Booking not found for Bot ${botID}.`);
    }

    const [reminderBookingStatusField] =
      await repoBooking.getReminderBookingStatusByField({
        "booking_reminders_status.name": statusName,
      });
    if (!reminderBookingStatusField) {
      throw new Error(`Confirmed Status not found.`);
    }
    const { uuid_unique: statusID } = reminderBookingStatusField;
    const { metadata, booking_date } = reminderBookingField;
    logger.info(
      `[updateBotReminderBooking] New status ID: ${statusID}, booking_date: ${booking_date}`
    );

    const updateData = {
      where: {
        "booking_reminders.bot_id": botID,
        "booking_reminders.contact_id": contactID,
        "booking_reminders.status": pendingStatusID,
      },
      data: {
        "booking_reminders.status": statusID,
        "booking_reminders.confirmed_at": dayjs().format("YYYY-MM-DD HH:mm:ss"),
        ...(dateTime != booking_date && {
          "booking_reminders.metadata": JSON.stringify({
            ...metadata,
            rescheduled_at: dateTime,
          }),
        }),
      },
    };

    const isReschedule = dateTime != booking_date;
    logger.info(
      `[updateBotReminderBooking] Is reschedule: ${isReschedule}, dateTime: ${dateTime}, booking_date: ${booking_date}`
    );

    await repoBooking.updateReminderBooking(updateData.where, updateData.data);
    logger.info(
      `[updateBotReminderBooking] Reminder booking updated successfully to status: ${statusName} for bot: ${botID}`
    );
  } catch (error) {
    logger.error(
      `[updateBotReminderBooking] Error updating reminder booking: ${error.message}`,
      { data, statusName }
    );
    await handleGaxiosError(error);
    throw new Error(error);
  }
};

const filterEventsByDateTime = async (events, timezone, datetime) => {
  logger.info(
    `[filterEventsByDateTime] Filtering ${events.length} events by datetime: ${datetime} in timezone: ${timezone}`
  );
  const targetDate = dayjs.tz(datetime, timezone);
  logger.info(
    `[filterEventsByDateTime] Target date parsed: ${targetDate.format()}`
  );

  const filteredEvents = events.filter((event) => {
    const eventStart = dayjs(event.startTime).tz(timezone);
    const matches = eventStart.isSame(targetDate, "minute");
    logger.info(
      `[filterEventsByDateTime] Event ${
        event.id || "unknown"
      } at ${eventStart.format()} matches: ${matches}`
    );
    return matches;
  });

  logger.info(
    `[filterEventsByDateTime] Filtered from ${events.length} to ${filteredEvents.length} events`
  );
  return filteredEvents;
};

module.exports = {
  googleAuth,
  revokeAuth,
  generateAuthUrl,
  getAvailableCalendarEvent,
  createCalendarEvent,
  updateCalendarEvent,
  getCalendarEvent,
  deleteCalendarEvent,
  updateBotReminderBooking,
  getAuthState,
};
