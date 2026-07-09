const dayjs = require("dayjs");

const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
const isBetween = require("dayjs/plugin/isBetween");

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);

const repoAgenda = require("../repositories/agenda");
const repoCompany = require("../repositories/company");

const isReserveHoursBlockedBySystem = async (body, participants = []) => {
  const { companyID, date, event_type_id, duration } = body;

  const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const datetime = dayjs(date);
  if (!datetime.isValid()) {
    throw new Error(`Invalid date ${date}.`);
  }

  if (datetime.isBefore(now)) {
    throw new Error(`Date cannot be before today.`);
  }

  const global_blocked_hours = await repoAgenda.getAgendaBlockedHoursByField({
    "agenda_blocked_hours.company_id": companyID,
    "agenda_blocked_hours.is_global": true,
  });

  const blocked_hours = (global_blocked_hours || []).map((data) => ({
    type: data.is_permanent ? "WEEKLY" : "DATE",
    data: data.is_permanent ? data.blocked_days : data.blocked_date,
    from: data.start_time,
    to: data.end_time,
  }));

  for (const account of participants) {
    const account_blocked_hours = await repoAgenda.getAgendaBlockedHoursByField(
      {
        "agenda_blocked_hours.company_id": companyID,
        "agenda_blocked_hours.account_id": account,
      }
    );

    blocked_hours.push(
      ...(account_blocked_hours || []).map((data) => ({
        type: data.is_permanent ? "WEEKLY" : "DATE",
        data: data.is_permanent ? data.blocked_days : data.blocked_date,
        from: data.start_time,
        to: data.end_time,
      }))
    );
  }

  if (!blocked_hours || blocked_hours.length === 0) {
    return false;
  }

  let isBlocked = false;
  if (blocked_hours.length > 0) {
    let event_duration;

    if (duration) {
      event_duration = duration;
    } else {
      const [eventTypeField] = await repoAgenda.getAgendaEventTypeByField({
        "agenda_event_types.uuid_unique": event_type_id,
        "agenda_event_types.company_id": companyID,
      });
      if (!eventTypeField) {
        throw new Error(`Event type ${event_type_id} not found.`);
      }

      event_duration = eventTypeField.duration;
    }

    for (const blocked_hour of blocked_hours) {
      if (
        (blocked_hour.type === "DATE" &&
          !datetime.isSame(dayjs(blocked_hour.data), "day")) ||
        (blocked_hour.type === "WEEKLY" &&
          !blocked_hour.data.includes(datetime.get("day")))
      ) {
        continue;
      }

      const endTime = datetime.add(event_duration, "minutes");

      const blockedFrom = datetime
        .startOf("day")
        .add(blocked_hour.from.split(":")[0], "hour")
        .add(blocked_hour.from.split(":")[1], "minute");

      const blockedTo = datetime
        .startOf("day")
        .add(blocked_hour.to.split(":")[0], "hour")
        .add(blocked_hour.to.split(":")[1], "minute");

      if (
        (datetime.isSameOrAfter(blockedFrom) && datetime.isBefore(blockedTo)) ||
        (endTime.isAfter(blockedFrom) && endTime.isSameOrBefore(blockedTo)) ||
        (datetime.isBefore(blockedFrom) && endTime.isAfter(blockedTo))
      ) {
        isBlocked = true;
        break;
      }
    }
  }

  return isBlocked;
};

const isReserveHoursBlockedByReserves = async (
  { date, duration, reserveID },
  reserves
) => {
  const filteredReserves = reserves.filter(
    (reserve) => reserve.uuid_unique !== reserveID
  );

  const newReserveEndTime = dayjs(date).add(duration, "minutes");

  return filteredReserves.some((reserve) => {
    const reserveStartTime = dayjs(reserve.date);
    const reserveEndTime = dayjs(reserve.date).add(
      reserve.event_duration,
      "minutes"
    );
    return (
      (newReserveEndTime.isAfter(reserveStartTime) &&
        newReserveEndTime.isBefore(reserveEndTime)) ||
      (reserveStartTime.isAfter(date) &&
        reserveStartTime.isBefore(newReserveEndTime))
    );
  });
};

const isBlockedHoursAlreadyReserved = async (reserves, body) => {
  try {
    const { blocked_date, blocked_days, start_time, end_time, is_permanent } =
      body;

    const [cancelledStatusField] =
      await repoAgenda.getAgendaReserveStatusByField({
        "agenda_reserves_status.name": "CANCELLED",
      });
    if (!cancelledStatusField) {
      throw new Error("Agenda reserve status CANCELLED not found.");
    }

    const [completedStatusField] =
      await repoAgenda.getAgendaReserveStatusByField({
        "agenda_reserves_status.name": "COMPLETED",
      });
    if (!completedStatusField) {
      throw new Error("Agenda reserve status COMPLETED not found.");
    }

    const blockedReserves = reserves.filter((reserve) => {
      if (
        (is_permanent && !blocked_days.includes(dayjs(reserve.date).day())) ||
        (!is_permanent &&
          !dayjs(blocked_date, "YYYY-MM-DD").isSame(
            dayjs(reserve.date),
            "day"
          )) ||
        reserve.status_id === cancelledStatusField.uuid_unique ||
        reserve.status_id === completedStatusField.uuid_unique
      ) {
        return false;
      }

      const datetime = dayjs(reserve.date);
      const endDatetime = datetime.add(reserve.event_type_duration, "minutes");
      const startBlockedTime = datetime
        .startOf("day")
        .add(start_time.split(":")[0], "hour")
        .add(start_time.split(":")[1], "minute");

      const endBlockedTime = datetime
        .startOf("day")
        .add(end_time.split(":")[0], "hour")
        .add(end_time.split(":")[1], "minute");

      if (
        (datetime.isSameOrAfter(startBlockedTime) &&
          datetime.isBefore(endBlockedTime)) ||
        (endDatetime.isAfter(startBlockedTime) &&
          endDatetime.isSameOrBefore(endBlockedTime)) ||
        (datetime.isBefore(startBlockedTime) &&
          endDatetime.isAfter(endBlockedTime))
      ) {
        return true;
      }
    });

    return blockedReserves;
  } catch (error) {
    throw new Error(
      `Error checking if blocked hours are already reserved: ${
        error.message ?? error
      }`
    );
  }
};

const reserveOverlaps = async (data) => {
  const { company_id, date, participants, event_type_id } = data;

  const [cancelledStatusField] = await repoAgenda.getAgendaReserveStatusByField(
    {
      "agenda_reserves_status.name": "CANCELLED",
    }
  );
  if (!cancelledStatusField) {
    throw new Error("Agenda reserve status CANCELLED not found.");
  }

  const [completedStatusField] = await repoAgenda.getAgendaReserveStatusByField(
    {
      "agenda_reserves_status.name": "COMPLETED",
    }
  );
  if (!completedStatusField) {
    throw new Error("Agenda reserve status COMPLETED not found.");
  }

  const reserves = await repoAgenda.getAgendaReserveByField((builder) =>
    builder
      .where("agenda_reserves.company_id", company_id)
      .where(
        "agenda_reserves.status_id",
        "!=",
        cancelledStatusField.uuid_unique
      )
      .where(
        "agenda_reserves.status_id",
        "!=",
        completedStatusField.uuid_unique
      )
      .whereRaw(
        `DATE(agenda_reserves.date) = '${dayjs(date).format("YYYY-MM-DD")}'`
      )
  );
  if (reserves.length === 0) {
    return false;
  }

  const [eventTypeField] = await repoAgenda.getAgendaEventTypeByField({
    "agenda_event_types.uuid_unique": event_type_id,
    "agenda_event_types.company_id": company_id,
  });
  if (!eventTypeField) {
    throw new Error(`Event type ${event_type_id} not found.`);
  }

  const configs = await getFormattedAgendaConfigs(company_id);

  /* eslint-disable indent */
    switch (configs.overlap_mode) {
    case "GLOBAL": {
      const reservesThatOverlap = reserves.filter((reserve) => {
        const reserveStart = dayjs(reserve.date);
        const reserveEnd = dayjs(reserve.date).add(
          reserve.event_type_duration,
          "minutes"
        );
        const newStart = dayjs(date);
        const newEnd = dayjs(date).add(eventTypeField.duration, "minutes");

        return (
          reserveStart.isBetween(newStart, newEnd) ||
          reserveEnd.isBetween(newStart, newEnd) ||
          (newStart.isSameOrAfter(reserveStart) &&
            newEnd.isSameOrBefore(reserveEnd))
        );
      });

      if (reservesThatOverlap.length > parseInt(configs.overlap_limit)) {
        return true;
      }
      break;
    }

    case "INDIVIDUAL": {
      for (const participant of participants) {
        const participantReserves =
          await repoAgenda.getAgendaReserveAccountsByField({
            "agenda_reserves_accounts.account_id": participant,
          });
        const participantReservesThatOverlap = participantReserves.filter(
          (res) => {
            const reserve = reserves.find(
              (r) => r.uuid_unique === res.agenda_reserve_id
            );
            if (!reserve) {
              return;
            }

            const reserveStart = dayjs(reserve.date);
            const reserveEnd = dayjs(reserve.date).add(
              reserve.event_type_duration,
              "minutes"
            );
            const newStart = dayjs(date);
            const newEnd = dayjs(date).add(eventTypeField.duration, "minutes");

            return (
              reserveStart.isBetween(newStart, newEnd) ||
              reserveEnd.isBetween(newStart, newEnd) ||
              (newStart.isSameOrAfter(reserveStart) &&
                newEnd.isSameOrBefore(reserveEnd))
            );
          }
        );

        if (participantReservesThatOverlap.length > 0) {
          return true;
        }
      }
      break;
    }
  }

  return false;
};

const overlapModes = ["GLOBAL", "INDIVIDUAL"];
const getFormattedAgendaConfigs = async (company_id) => {
  const [overlapModeField] = await repoCompany.getCompanyConfigByField({
    "company_configs.company_id": company_id,
    "configs_templates.owner_type": "agenda",
    "configs_templates.key": "OVERLAP_MODE",
  });
  if (!overlapModeField || !overlapModes.includes(overlapModeField.data)) {
    throw new Error(`Overlap mode not found.`);
  }

  const [overlapLimitField] = await repoCompany.getCompanyConfigByField({
    "company_configs.company_id": company_id,
    "configs_templates.owner_type": "agenda",
    "configs_templates.key": "OVERLAP_LIMIT",
  });
  if (!overlapLimitField) {
    throw new Error(`Overlap limit not found.`);
  }

  return {
    overlap_mode: overlapModeField.data,
    overlap_limit: overlapLimitField.data,
  };
};

module.exports = {
  reserves: {
    system: isReserveHoursBlockedBySystem,
    other_reserves: isReserveHoursBlockedByReserves,
    overlaps: reserveOverlaps,
  },
  blocked_hours: {
    reserves: isBlockedHoursAlreadyReserved,
  },
  getFormattedAgendaConfigs,
};
