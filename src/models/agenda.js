const dayjs = require("dayjs");

const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
const localizedFormat = require("dayjs/plugin/localizedFormat");
const isBetween = require("dayjs/plugin/isBetween");

const modelBots = require("./bots");

const repoAgenda = require("../repositories/agenda");
const repoCompany = require("../repositories/company");
const repoAccounts = require("../repositories/accounts");
const repoBots = require("../repositories/bots");
const repoAWS = require("../repositories/aws");

const { sendDataToInstance } = require("../utils/sendDataToInstance");
const createBotQueue = require("../utils/rabbit/createBotQueue");
const generateRandomToken = require("../utils/generateRandomToken");
const areBlocked = require("../utils/agendaBlocks");
const { BOT_EVENTS } = require("../utils/events");

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(localizedFormat);
dayjs.extend(isBetween);

const getAgendaReserves = async (query) => {
  try {
    const { companyID, ...params } = query;

    const searchParams = Object.keys(params).reduce((acc, key) => {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        acc[`agenda_reserves.${key}`] = params[key];
      }
      return acc;
    }, {});

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    return await repoAgenda.getAgendaReserveByField({
      "agenda_reserves.company_id": companyID,
      ...searchParams,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const getAgendaReservesStatus = async (query) => {
  try {
    const { companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    return await repoAgenda.getAgendaReserveStatusByField({});
  } catch (error) {
    throw new Error(error);
  }
};

const createAgendaReserve = async (query, body) => {
  try {
    const { companyID, botID } = query;
    const {
      participants,
      phone_numbers,
      event_type_id,
      date,
      name,
      public_notes,
      private_notes,
    } = body;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [eventTypeField] = await repoAgenda.getAgendaEventTypeByField({
      "agenda_event_types.uuid_unique": event_type_id,
      "agenda_event_types.company_id": companyID,
    });
    if (!eventTypeField) {
      throw new Error(`Event type ${event_type_id} not found.`);
    }

    const isBlocked = await areBlocked.reserves.system(
      { ...body, companyID },
      participants
    );
    if (isBlocked) {
      throw new Error(
        `Date from ${dayjs(date).format("YYYY-MM-DD HH:mm")} to ${dayjs(date)
          .add(eventTypeField.duration, "minutes")
          .format("HH:mm")} is blocked.`
      );
    }

    const overlaps = await areBlocked.reserves.overlaps({
      ...body,
      company_id: companyID,
      participants,
    });
    if (overlaps) {
      throw new Error(
        `Date from ${dayjs(date).format("YYYY-MM-DD HH:mm")} to ${dayjs(date)
          .add(eventTypeField.duration, "minutes")
          .format("HH:mm")} overlaps with another reserve.`
      );
    }

    const [activeStatusField] = await repoAgenda.getAgendaReserveStatusByField({
      "agenda_reserves_status.name": "ACTIVE",
    });
    if (!activeStatusField) {
      throw new Error(`Agenda reserve status ACTIVE not found.`);
    }

    const result = await repoAgenda.saveAgendaReserve({
      company_id: companyID,
      name,
      date: dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
      participants,
      phone_numbers: JSON.stringify(phone_numbers),
      event_type_id,
      status_id: activeStatusField.uuid_unique,
      public_notes,
      private_notes,
    });

    await notificateAgendaReserve(
      `Your appointment *"${name}"* has been scheduled for *${dayjs(
        date
      ).format("LLLL")}*.`,
      [...(phone_numbers || [])],
      botID || undefined
    );

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const updateAgendaReserve = async (query, body) => {
  try {
    const { companyID, agendaReserveID, botID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [agendaReserveField] = await repoAgenda.getAgendaReserveByField({
      "agenda_reserves.uuid_unique": agendaReserveID,
      "agenda_reserves.company_id": companyID,
    });
    if (!agendaReserveField) {
      throw new Error(`Agenda reserve ${agendaReserveID} not found.`);
    }
    if (agendaReserveField.status_name == "COMPLETED") {
      throw new Error(
        `Agenda reserve ${agendaReserveID} is already completed.`
      );
    }

    const fieldsToUpdate = [
      "name",
      "date",
      "event_type_id",
      "status_id",
      "public_notes",
      "private_notes",
    ];
    const arraysToUpdate = ["participants", "phone_numbers"];
    let dataUpdate = {};

    fieldsToUpdate.forEach((field) => {
      if (
        body[field] != undefined &&
        body[field] != agendaReserveField[field]
      ) {
        dataUpdate[field] = body[field];
      }
    });

    arraysToUpdate.forEach((field) => {
      if (body[field] != undefined) {
        const areEqual =
          agendaReserveField[field].length == body[field].length &&
          agendaReserveField[field].every(
            (value, index) => value === body[field][index]
          );
        if (!areEqual) {
          dataUpdate[field] = body[field];
        }
      }
    });

    let logData = { ...dataUpdate };

    const [eventTypeField] = await repoAgenda.getAgendaEventTypeByField({
      "agenda_event_types.uuid_unique":
        dataUpdate.event_type_id || agendaReserveField.event_type_id,
      "agenda_event_types.company_id": companyID,
    });
    if (!eventTypeField) {
      throw new Error(
        `Event type ${
          dataUpdate.event_type_id || agendaReserveField.event_type_id
        } not found.`
      );
    }

    if (dataUpdate.status_id) {
      const [statusField] = await repoAgenda.getAgendaReserveStatusByField({
        "agenda_reserves_status.uuid_unique": dataUpdate.status_id,
      });
      if (!statusField) {
        throw new Error(
          `Agenda reserve status ${dataUpdate.status_id} not found.`
        );
      }

      if (statusField.name !== "CANCELLED" && statusField.name !== "ACTIVE") {
        throw new Error(
          `Agenda reserve status only can be CANCELLED or ACTIVE.`
        );
      }

      if (
        agendaReserveField.status_name == "CANCELLED" &&
        statusField.name == "ACTIVE" &&
        dayjs(dataUpdate.date || agendaReserveField.date).isBefore(dayjs())
      ) {
        throw new Error(
          `Agenda reserve ${agendaReserveID} cannot be activated with a past date.`
        );
      }
    }

    if (dataUpdate.event_type_id) {
      const isBlocked = await areBlocked.reserves.system(
        {
          ...body,
          companyID,
          date: dataUpdate.date || agendaReserveField.date,
        },
        dataUpdate.participants || JSON.parse(agendaReserveField.participants)
      );
      if (isBlocked) {
        throw new Error(
          `Date from ${dayjs(dataUpdate.date || agendaReserveField.date).format(
            "YYYY-MM-DD HH:mm"
          )} to ${dayjs(dataUpdate.date || agendaReserveField.date)
            .add(eventTypeField.duration, "minutes")
            .format("HH:mm")} is blocked.`
        );
      }
    }

    if (dataUpdate.date) {
      const isBlocked = await areBlocked.reserves.system(
        {
          ...body,
          companyID,
          date: dataUpdate.date,
          event_type_id:
            dataUpdate.event_type_id || agendaReserveField.event_type_id,
        },
        dataUpdate.participants
          ? dataUpdate.participants
          : JSON.parse(agendaReserveField.participants)
      );
      if (isBlocked) {
        throw new Error(
          `Date from ${dayjs(dataUpdate.date).format(
            "YYYY-MM-DD HH:mm"
          )} to ${dayjs(dataUpdate.date)
            .add(eventTypeField.duration, "minutes")
            .format("HH:mm")} is blocked.`
        );
      }
    }

    if (dataUpdate.participants) {
      const previousParticipants = agendaReserveField.participants;
      const newParticipants = dataUpdate.participants.filter(
        (participant) => !previousParticipants.includes(participant)
      );
      const removedParticipants = previousParticipants.filter(
        (participant) => !dataUpdate.participants.includes(participant)
      );

      logData.participants = {};
      dataUpdate.participants = {};

      if (newParticipants.length > 0) {
        dataUpdate.participants.added = newParticipants;
        logData.participants.added = await Promise.all(
          newParticipants.map(async (participant) => {
            const [accountField] = await repoAccounts.getAccountByField({
              "accounts.uuid_unique": participant,
              "accounts.company_id": companyID,
            });
            if (!accountField) {
              throw new Error(`Account ${participant} not found.`);
            }
            return {
              first_name: accountField.first_name,
              last_name: accountField.last_name,
              email: accountField.email,
              phone: accountField.phone,
              role: accountField.role_name,
            };
          })
        );
      }

      if (removedParticipants.length > 0) {
        dataUpdate.participants.removed = removedParticipants;
        logData.participants.removed = await Promise.all(
          removedParticipants.map(async (participant) => {
            const [accountField] = await repoAccounts.getAccountByField({
              "accounts.uuid_unique": participant,
              "accounts.company_id": companyID,
            });
            return {
              first_name: accountField.first_name,
              last_name: accountField.last_name,
              email: accountField.email,
              phone: accountField.phone,
              role: accountField.role_name,
            };
          })
        );
      }
    }

    if (dataUpdate.phone_numbers) {
      dataUpdate.phone_numbers = JSON.stringify(dataUpdate.phone_numbers);
    }

    if (Object.keys(dataUpdate).length == 0) {
      return true;
    }

    const result = await repoAgenda.updateAgendaReserve(
      { "agenda_reserves.uuid_unique": agendaReserveID },
      dataUpdate
    );

    if (dataUpdate.phone_numbers) {
      const previousPhoneNumbers =
        JSON.parse(agendaReserveField.phone_numbers) || [];
      const newPhoneNumbers = body.phone_numbers || [];

      const addedNumbers = [...newPhoneNumbers].filter(
        (num) => !previousPhoneNumbers.includes(num)
      );
      const removedNumbers = [...previousPhoneNumbers].filter(
        (num) => !newPhoneNumbers.includes(num)
      );

      const messageDate = dayjs(
        dataUpdate.date || agendaReserveField.date
      ).format("LLLL");
      await notificateAgendaReserve(
        `Your appointment *"${
          dataUpdate.name || agendaReserveField.name
        }"* has been scheduled for *${messageDate}*.`,
        addedNumbers,
        botID || undefined
      );

      await notificateAgendaReserve(
        `The appointment *${
          dataUpdate.name || agendaReserveField.name
        }* scheduled for *${messageDate}* has been canceled.`,
        removedNumbers,
        botID || undefined
      );

      logData.phone_numbers = {};
      if (addedNumbers.length > 0) {
        logData.phone_numbers.added = addedNumbers;
      }
      if (removedNumbers.length > 0) {
        logData.phone_numbers.removed = removedNumbers;
      }
    }

    await updateAgendaReserveLog(agendaReserveID, "UPDATE", logData);

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const deleteAgendaReserve = async (query) => {
  try {
    const { companyID, agendaReserveID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [agendaReserveField] = await repoAgenda.getAgendaReserveByField({
      "agenda_reserves.uuid_unique": agendaReserveID,
      "agenda_reserves.company_id": companyID,
    });
    if (!agendaReserveField) {
      throw new Error(`Agenda reserve ${agendaReserveID} not found.`);
    }

    const result = await repoAgenda.deleteAgendaReserve(agendaReserveID);
    if (result) {
      await updateAgendaReserveLog(agendaReserveID, "DELETE", null);
    }

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const getAgendaLink = async (query) => {
  try {
    const { key } = query;

    const [linkField] = await repoAgenda.getAgendaLinksByField({
      "agenda_links.key": key,
    });
    if (!linkField || linkField.status != true) {
      throw new Error(`Link ${key} not found.`);
    }

    return linkField;
  } catch (error) {
    throw new Error(error);
  }
};

const joinAgendaLinkReserve = async (query) => {
  try {
    const { key, phone } = query;

    const [linkField] = await repoAgenda.getAgendaLinksByField({
      "agenda_links.key": key,
    });
    if (!linkField || linkField.status != true) {
      throw new Error(`Link ${key} not found.`);
    }

    const reserveID = linkField.reserve_id;

    const [reserveField] = await repoAgenda.getAgendaReserveByField({
      "agenda_reserves.uuid_unique": reserveID,
    });
    if (!reserveField) {
      throw new Error(`Reserve ${reserveID} not found.`);
    }

    const [statusField] = await repoAgenda.getAgendaReserveStatusByField({
      "agenda_reserves_status.uuid_unique": reserveField.status_id,
    });
    if (!statusField) {
      throw new Error(`Reserve status ${reserveField.status_id} not found.`);
    }

    if (statusField.name == "CANCELLED" || statusField.name == "COMPLETED") {
      throw new Error(`Reserve ${reserveID} is ${statusField.name}.`);
    }

    const phone_numbers = JSON.parse(reserveField.phone_numbers);
    if (phone_numbers.includes(phone)) {
      throw new Error(`Phone number ${phone} already exists in reserve.`);
    }

    const newPhoneNumbers = [...phone_numbers, phone];

    await repoAgenda.updateAgendaReserve(
      { "agenda_reserves.uuid_unique": reserveID },
      { phone_numbers: JSON.stringify(newPhoneNumbers) }
    );

    await updateAgendaReserveLog(reserveID, "UPDATE", {
      phone_numbers: { added: phone, method: "LINK" },
    });

    await notificateAgendaReserve(
      `You have been added to appointment *"${
        reserveField.name
      }"* on *${dayjs(reserveField.date).format(
        "LLLL"
      )}* successfully.`,
      [phone]
    );

    await modelBots.sendMessageAsBot(
      phone,
      `Phone number ${phone} has been added to appointment *"${
        reserveField.name
      }"* on *${dayjs(reserveField.date).format("LLLL")}*.`
    );

    return linkField;
  } catch (error) {
    throw new Error(error);
  }
};

const getAgendaLinksByCompany = async (query) => {
  try {
    const { companyID } = query;
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    return await repoAgenda.getAgendaLinksByField({
      "agenda_links.company_id": companyID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const createAgendaLink = async (query) => {
  try {
    const { companyID, reserveID } = query;
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [reserveField] = await repoAgenda.getAgendaReserveByField({
      "agenda_reserves.uuid_unique": reserveID,
      "agenda_reserves.company_id": companyID,
    });
    if (!reserveField) {
      throw new Error(`Reserve ${reserveID} not found.`);
    }

    const [statusField] = await repoAgenda.getAgendaReserveStatusByField({
      "agenda_reserves_status.uuid_unique": reserveField.status_id,
    });
    if (!statusField) {
      throw new Error(`Reserve status ${reserveField.status_id} not found.`);
    }

    if (statusField.name == "CANCELLED" || statusField.name == "COMPLETED") {
      throw new Error(`Reserve ${reserveID} is ${statusField.name}.`);
    }

    const [existsLink] = await repoAgenda.getAgendaLinksByField({
      "agenda_links.company_id": companyID,
      "agenda_links.reserve_id": reserveID,
    });
    if (existsLink) {
      return existsLink;
    }

    const result = await repoAgenda.saveAgendaLink({
      company_id: companyID,
      reserve_id: reserveID,
      key: generateRandomToken(8),
    });

    await updateAgendaReserveLog(reserveID, "CREATE", {
      link: result.key,
      link_id: result.uuid_unique,
      status: "ACTIVE",
    });

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const updateAgendaLink = async (query, body) => {
  try {
    const { companyID, linkID } = query;
    const { status } = body;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [linkField] = await repoAgenda.getAgendaLinksByField({
      "agenda_links.company_id": companyID,
      "agenda_links.uuid_unique": linkID,
    });
    if (!linkField) {
      throw new Error(`Link ${linkID} not found.`);
    }

    if (status == linkField.status) {
      return true;
    }

    const result = await repoAgenda.updateAgendaLink(
      { "agenda_links.uuid_unique": linkID },
      { status }
    );
    if (result) {
      await updateAgendaReserveLog(linkField.reserve_id, "UPDATE", { status });
    }

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const deleteAgendaLink = async (query) => {
  try {
    const { companyID, linkID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [linkField] = await repoAgenda.getAgendaLinksByField({
      "agenda_links.company_id": companyID,
      "agenda_links.uuid_unique": linkID,
    });
    if (!linkField) {
      throw new Error(`Link ${linkID} not found.`);
    }

    const result = await repoAgenda.deleteAgendaLink(linkID);
    if (result) {
      await updateAgendaReserveLog(linkField.reserve_id, "DELETE", {
        link: linkField.key,
        link_id: linkID,
      });
    }

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const getAgendaEventTypes = async (query) => {
  try {
    const { companyID } = query;
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    return await repoAgenda.getAgendaEventTypeByField({
      "agenda_event_types.company_id": companyID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const createAgendaEventType = async (query, body) => {
  try {
    const { companyID } = query;
    const { name, description, duration } = body;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    return await repoAgenda.saveAgendaEventType({
      company_id: companyID,
      name,
      description,
      duration,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const updateAgendaEventType = async (query, body) => {
  try {
    const { companyID, agendaEventTypeID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [agendaEventTypeField] = await repoAgenda.getAgendaEventTypeByField({
      "agenda_event_types.company_id": companyID,
      "agenda_event_types.uuid_unique": agendaEventTypeID,
    });
    if (!agendaEventTypeField) {
      throw new Error(`Agenda event type ${agendaEventTypeID} not found.`);
    }

    const fieldsToUpdate = ["name", "description", "duration"];
    let dataUpdate = {};
    let logData = {};

    fieldsToUpdate.forEach((field) => {
      if (
        body[field] !== undefined &&
        body[field] !== agendaEventTypeField[field]
      ) {
        dataUpdate[field] = body[field];
        logData[`event_type_${field}`] = body[field];
      }
    });

    const reserves = await repoAgenda.getAgendaReserveByField({
      "agenda_reserves.company_id": companyID,
      "agenda_reserves.event_type_id": agendaEventTypeID,
    });

    if (
      dataUpdate.duration &&
      dataUpdate.duration > agendaEventTypeField.duration
    ) {
      if (reserves.length > 0) {
        const reserves = await repoAgenda.getAgendaReserveByField({
          "agenda_reserves.company_id": companyID,
        });

        const filteredReserves = reserves.filter(
          (reserve) =>
            reserve.status_name != "CANCELLED" &&
            reserve.status_name != "COMPLETED"
        );

        const isBlocked = await Promise.all(
          reserves.map(async (reserve) => {
            const isBlockedByHours = await areBlocked.reserves.system({
              companyID,
              date: reserve.date,
              participants: JSON.parse(reserve.participants),
              duration: dataUpdate.duration,
            });

            const isBlockedByOtherReserves =
              await areBlocked.reserves.other_reserves(
                {
                  date: reserve.date,
                  duration: dataUpdate.duration,
                  reserveID: reserve.uuid_unique,
                },
                filteredReserves
              );

            return isBlockedByHours || isBlockedByOtherReserves;
          })
        );

        if (isBlocked.some((blocked) => blocked)) {
          throw new Error(
            `Agenda event type ${agendaEventTypeID} has reserves that conflict with the new duration.`
          );
        }
      }
    }

    if (reserves.length > 0) {
      await Promise.all(
        reserves.map((reserve) =>
          updateAgendaReserveLog(reserve.uuid_unique, "UPDATE", logData)
        )
      );
    }

    if (Object.keys(dataUpdate).length == 0) {
      return true;
    }

    return await repoAgenda.updateAgendaEventType(
      { "agenda_event_types.uuid_unique": agendaEventTypeID },
      dataUpdate
    );
  } catch (error) {
    throw new Error(error);
  }
};

const deleteAgendaEventType = async (query) => {
  try {
    const { companyID, agendaEventTypeID } = query;
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [agendaEventTypeField] = await repoAgenda.getAgendaEventTypeByField({
      "agenda_event_types.company_id": companyID,
      "agenda_event_types.uuid_unique": agendaEventTypeID,
    });
    if (!agendaEventTypeField) {
      throw new Error(`Agenda event type ${agendaEventTypeID} not found.`);
    }

    const reservesWithEventType = await repoAgenda.getAgendaReserveByField({
      "agenda_reserves.event_type_id": agendaEventTypeID,
    });
    if (reservesWithEventType.length > 0) {
      throw new Error(
        `Agenda event type ${agendaEventTypeID} has reserves, can't delete.`
      );
    }

    return await repoAgenda.deleteAgendaEventType(agendaEventTypeID);
  } catch (error) {
    throw new Error(error);
  }
};

const getAgendaBlockedHours = async (query) => {
  try {
    const { companyID, accountID, permanent } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    if (accountID) {
      const [accountField] = await repoAccounts.getAccountByField({
        "accounts.uuid_unique": accountID,
        "accounts.company_id": companyID,
      });
      if (!accountField) {
        throw new Error(`Incorrect account ID ${accountID}.`);
      }
    }

    let search_query = {
      "agenda_blocked_hours.company_id": companyID,
    };

    if (accountID) {
      search_query["agenda_blocked_hours.account_id"] = accountID;
      search_query["agenda_blocked_hours.is_global"] = false;
    }

    if (permanent) {
      search_query["agenda_blocked_hours.is_permanent"] =
        permanent === true || permanent === "true" ? true : false;
    }

    return await repoAgenda.getAgendaBlockedHoursByField(search_query);
  } catch (error) {
    throw new Error(error);
  }
};

const createAgendaBlockedHours = async (query, body) => {
  try {
    const { companyID, accountID } = query;
    const {
      blocked_date,
      blocked_days,
      start_time,
      end_time,
      is_global,
      is_permanent,
      reason,
    } = body;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const startTime = dayjs(start_time, "HH:mm");
    const endTime = dayjs(end_time, "HH:mm");

    if (dayjs(startTime, "HH:mm").isSameOrAfter(dayjs(endTime, "HH:mm"))) {
      throw new Error("Start time cannot be after end time.");
    }

    const reserves = await repoAgenda.getAgendaReserveByField({
      "agenda_reserves.company_id": companyID,
    });
    if (reserves.length > 0) {
      const blockedReserves = await areBlocked.blocked_hours.reserves(
        reserves,
        body
      );

      if (blockedReserves.length > 0) {
        throw new Error(
          `Blocked hours conflict with ${blockedReserves.length} reserves.`
        );
      }
    }

    let db_query = {
      "agenda_blocked_hours.company_id": companyID,
      "agenda_blocked_hours.is_global": true,
      "agenda_blocked_hours.is_permanent": false,
      "agenda_blocked_hours.start_time": startTime.format("HH:mm"),
      "agenda_blocked_hours.end_time": endTime.format("HH:mm"),
      "agenda_blocked_hours.reason": reason,
    };

    if (!is_global) {
      if (!accountID) {
        throw new Error("Account ID is required.");
      }

      const [accountField] = await repoAccounts.getAccountByField({
        "accounts.uuid_unique": accountID,
        "accounts.company_id": companyID,
      });
      if (!accountField) {
        throw new Error(`Account ${accountID} not found.`);
      }

      db_query = {
        ...db_query,
        "agenda_blocked_hours.account_id": accountID,
        "agenda_blocked_hours.is_global": false,
      };
    }

    if (!is_permanent) {
      if (!blocked_date) {
        throw new Error("Blocked date is required.");
      }

      const now = dayjs().format("YYYY-MM-DD");
      const blockedDate = dayjs(blocked_date).format("YYYY-MM-DD");
      if (dayjs(blockedDate).isBefore(now)) {
        throw new Error("Blocked date cannot be before today.");
      }

      db_query = {
        ...db_query,
        "agenda_blocked_hours.blocked_date": blockedDate,
        "agenda_blocked_hours.is_permanent": false,
      };
    } else {
      if (
        !blocked_days ||
        blocked_days.length === 0 ||
        !Array.isArray(blocked_days)
      ) {
        throw new Error("Blocked days are required.");
      }

      db_query = {
        ...db_query,
        "agenda_blocked_hours.blocked_days": JSON.stringify(blocked_days),
        "agenda_blocked_hours.is_permanent": true,
      };
    }

    return await repoAgenda.saveAgendaBlockedHours(db_query);
  } catch (error) {
    throw new Error(error);
  }
};

const updateAgendaBlockedHours = async (query, body) => {
  try {
    const { companyID, accountID, agendaBlockedHoursID } = query;
    const { is_global, is_permanent, blocked_date, blocked_days } = body;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [agendaBlockedHoursField] =
      await repoAgenda.getAgendaBlockedHoursByField({
        "agenda_blocked_hours.company_id": companyID,
        "agenda_blocked_hours.uuid_unique": agendaBlockedHoursID,
      });
    if (!agendaBlockedHoursField) {
      throw new Error(
        `Agenda blocked hours ${agendaBlockedHoursID} not found.`
      );
    }

    const fieldsToUpdate = ["start_time", "end_time", "reason"];
    let updatedFields = {};

    fieldsToUpdate.forEach((field) => {
      if (
        body[field] !== undefined &&
        body[field] !== agendaBlockedHoursField[field]
      ) {
        updatedFields[field] = body[field];
      }
    });

    if (
      is_global !== undefined &&
      is_global != agendaBlockedHoursField.is_global
    ) {
      updatedFields["is_global"] = is_global;

      if (is_global) {
        updatedFields["account_id"] = null;
      } else {
        if (!accountID) {
          throw new Error("Account ID is required for non-global entries.");
        }

        const [accountField] = await repoAccounts.getAccountByField({
          "accounts.uuid_unique": accountID,
          "accounts.company_id": companyID,
        });
        if (!accountField) {
          throw new Error(`Account ${accountID} not found.`);
        }

        updatedFields["account_id"] = accountID;
      }
    }

    if (
      is_permanent !== undefined &&
      is_permanent != agendaBlockedHoursField.is_permanent
    ) {
      updatedFields["agenda_blocked_hours.is_permanent"] = is_permanent;

      const reserves = await repoAgenda.getAgendaReserveByField({
        "agenda_reserves.company_id": companyID,
      });

      if (is_permanent) {
        if (
          !blocked_days ||
          !Array.isArray(blocked_days) ||
          blocked_days.length === 0
        ) {
          throw new Error("Blocked days are required for permanent entries.");
        }

        const isBlocked = await areBlocked.blocked_hours.reserves(
          reserves,
          body
        );
        if (isBlocked) {
          throw new Error(
            `Blocked hours conflict with ${isBlocked.length} reserves.`
          );
        }

        updatedFields["blocked_days"] = JSON.stringify(blocked_days);
        updatedFields["blocked_date"] = null;
      } else {
        if (!blocked_date) {
          throw new Error(
            "Blocked date is required for non-permanent entries."
          );
        }

        const isBlocked = await areBlocked.blocked_hours.reserves(
          reserves,
          body
        );
        if (isBlocked) {
          throw new Error(
            `Blocked hours conflict with ${isBlocked.length} reserves.`
          );
        }

        const now = dayjs().format("YYYY-MM-DD");
        const blockedDate = dayjs(blocked_date).format("YYYY-MM-DD");

        if (dayjs(blockedDate).isBefore(now)) {
          throw new Error("Blocked date cannot be before today.");
        }

        updatedFields["blocked_date"] = blockedDate;
        updatedFields["blocked_days"] = null;
      }
    }

    if (
      updatedFields.start_time !== undefined ||
      updatedFields.end_time !== undefined
    ) {
      const formatedStartTime =
        updatedFields.start_time !== undefined
          ? dayjs(updatedFields.start_time, "HH:mm")
          : dayjs(agendaBlockedHoursField.start_time, "HH:mm");

      const formatedEndTime =
        updatedFields.end_time !== undefined
          ? dayjs(updatedFields.end_time, "HH:mm")
          : dayjs(agendaBlockedHoursField.end_time, "HH:mm");

      if (!formatedStartTime.isValid() || !formatedEndTime.isValid()) {
        throw new Error("Invalid time format.");
      }

      if (formatedStartTime.isSameOrAfter(formatedEndTime)) {
        throw new Error("Start time cannot be same or after end time.");
      }

      if (updatedFields.start_time !== undefined) {
        updatedFields.start_time = formatedStartTime.format("HH:mm");
      }

      if (updatedFields.end_time !== undefined) {
        updatedFields.end_time = formatedEndTime.format("HH:mm");
      }

      const reserves = await repoAgenda.getAgendaReserveByField({
        "agenda_reserves.company_id": companyID,
      });

      const isBlocked = await areBlocked.blocked_hours.reserves(reserves, {
        ...agendaBlockedHoursField,
        ...updatedFields,
      });

      if (isBlocked.length > 0) {
        throw new Error(
          `Blocked hours conflict with ${isBlocked.length} reserves.`
        );
      }
    }

    if (Object.keys(updatedFields).length === 0) {
      return true;
    }

    return await repoAgenda.updateAgendaBlockedHours(
      { "agenda_blocked_hours.uuid_unique": agendaBlockedHoursID },
      updatedFields
    );
  } catch (error) {
    throw new Error(error);
  }
};

const deleteAgendaBlockedHours = async (query) => {
  try {
    const { companyID, agendaBlockedHoursID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [agendaBlockedHoursField] =
      await repoAgenda.getAgendaBlockedHoursByField({
        "agenda_blocked_hours.company_id": companyID,
        "agenda_blocked_hours.uuid_unique": agendaBlockedHoursID,
      });
    if (!agendaBlockedHoursField) {
      throw new Error(
        `Agenda blocked hours ${agendaBlockedHoursID} not found.`
      );
    }

    return await repoAgenda.deleteAgendaBlockedHours(agendaBlockedHoursID);
  } catch (error) {
    throw new Error(error);
  }
};

const notificateAgendaReserve = async (message, phone_numbers, botID) => {
  if (botID) {
    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${botID} does not have an instance.`);
    }

    const botQueue = createBotQueue(botID);
    for (let i = 0; i < phone_numbers.length; i++) {
      setTimeout(async () => {
        await sendDataToInstance(botQueue, BOT_EVENTS.SEND_MESSAGE, {
          body: {
            phone: phone_numbers[i].replace("+", ""),
            message,
          },
        });
      }, i * 1500);
    }
  } else {
    for (let i = 0; i < phone_numbers.length; i++) {
      setTimeout(async () => {
        await modelBots.sendMessageAsBot(phone_numbers[i], message);
      }, i * 1500);
    }
  }
};

const getAgendaReserveLog = async (query) => {
  try {
    const { companyID, agendaReserveID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ${companyID} not found.`);
    }

    const [agendaReserveField] = await repoAgenda.getAgendaReserveByField({
      "agenda_reserves.uuid_unique": agendaReserveID,
      "agenda_reserves.company_id": companyID,
    });
    if (!agendaReserveField) {
      throw new Error(`Agenda reserve ${agendaReserveID} not found.`);
    }

    const [reserveLogField] = await repoAgenda.getAgendaReserveLogsByField({
      "agenda_reserves_logs.company_id": companyID,
      "agenda_reserves_logs.agenda_reserve_id": agendaReserveID,
    });
    if (!reserveLogField) {
      throw new Error(`Agenda reserve log ${agendaReserveID} not found.`);
    }

    return reserveLogField;
  } catch (error) {
    throw new Error(error);
  }
};

const updateAgendaReserveLog = async (reserve_id, action, data) => {
  try {
    const [reserveLogField] = await repoAgenda.getAgendaReserveLogsByField({
      "agenda_reserves_logs.agenda_reserve_id": reserve_id,
    });
    if (!reserveLogField) {
      throw new Error(`Agenda reserve log ${reserve_id} not found.`);
    }

    const prevData = JSON.parse(reserveLogField.data);

    return await repoAgenda.updateAgendaReserveLog(
      { "agenda_reserves_logs.uuid_unique": reserveLogField.uuid_unique },
      {
        data: JSON.stringify([
          ...prevData,
          {
            action: action,
            data: data,
            date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          },
        ]),
      }
    );
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getAgendaReserves,
  getAgendaReservesStatus,
  createAgendaReserve,
  updateAgendaReserve,
  deleteAgendaReserve,
  getAgendaLink,
  joinAgendaLinkReserve,
  getAgendaLinksByCompany,
  createAgendaLink,
  updateAgendaLink,
  deleteAgendaLink,
  getAgendaEventTypes,
  createAgendaEventType,
  updateAgendaEventType,
  deleteAgendaEventType,
  getAgendaBlockedHours,
  createAgendaBlockedHours,
  updateAgendaBlockedHours,
  deleteAgendaBlockedHours,
  getAgendaReserveLog,
};
