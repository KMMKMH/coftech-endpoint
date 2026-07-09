const dayjs = require("dayjs");
const db = require("../utils/db");
const logger = require("../utils/logger");

const getAgendaReserveByField = async (data, isRaw = false) => {
  try {
    const query = db("agenda_reserves")
      .select("agenda_reserves.*")
      .select("agenda_event_types.name AS event_type_name")
      .select("agenda_event_types.duration AS event_type_duration")
      .select("agenda_reserves_status.name AS status_name")
      .select(db.raw("COALESCE(GROUP_CONCAT(agenda_reserves_accounts.account_id), '') AS participants"))

      .leftJoin("agenda_event_types", "agenda_event_types.uuid_unique", "agenda_reserves.event_type_id")
      .leftJoin("agenda_reserves_status", "agenda_reserves_status.uuid_unique", "agenda_reserves.status_id")
      .leftJoin("agenda_reserves_accounts", "agenda_reserves.uuid_unique", "agenda_reserves_accounts.agenda_reserve_id")
      .groupBy("agenda_reserves.uuid_unique")
      .orderBy("agenda_reserves.date", "asc");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      if (data["agenda_reserves.date"]) {
        query.whereRaw('DATE(agenda_reserves.date) = ?', [dayjs(data["agenda_reserves.date"]).format('YYYY-MM-DD')]);
        delete data["agenda_reserves.date"];
      }
      
      query.where(data);
    }

    const result = await query;

    return result.length > 0
      ? result.map((reserve) => ({
        ...reserve,
        participants: reserve.participants ? reserve.participants.split(",") : [],
      }))
      : [];
  } catch (error) {
    logger.error(
      `Error getting agenda reserve with data: ${JSON.stringify(data)}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

const getAgendaReserveStatusByField = async (data, isRaw = false) => {
  try {
    const query = db("agenda_reserves_status");

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
      `Error getting agenda reserve status with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const getAgendaReserveAccountsByField = async (data, isRaw = false) => {
  try {
    const query = db("agenda_reserves_accounts")    

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
      `Error getting agenda reserve participants with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const saveAgendaReserve = async (data) => {
  const transaction = await db.transaction();

  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    data.phone_numbers = JSON.stringify(data.phone_numbers);
    const { participants, ...reserveData } = data;

    logger.info(`Saving agenda reserve with data: ${JSON.stringify(reserveData)}`);

    const [reserveId] = await transaction("agenda_reserves").insert(reserveData);
    const response = reserveId
      ? (await transaction("agenda_reserves").where({ "agenda_reserves.id": reserveId }))[0]
      : false;

    const participantsData = participants.map(account => ({
      agenda_reserve_id: response.uuid_unique,
      account_id: account,
    }));
    await transaction.batchInsert("agenda_reserves_accounts", participantsData);

    const [eventTypeField] = await transaction("agenda_event_types").where({ uuid_unique: data.event_type_id });

    await transaction("agenda_reserves_logs").insert({
      company_id: data.company_id,
      agenda_reserve_id: response.uuid_unique,
      data: JSON.stringify(
        JSON.stringify([
          {
            action: "CREATE",
            data: {
              name: data.name,
              participants: await Promise.all(
                participants.map(async (participant) => {
                  const [accountField] = await transaction("accounts").where({
                    "accounts.uuid_unique": participant,
                    "accounts.company_id": data.company_id,
                  });
                  return {
                    first_name: accountField.first_name,
                    last_name: accountField.last_name,
                    email: accountField.email,
                    phone: accountField.phone,
                    role: accountField.role_name,
                  };
                })
              ),
              phone_numbers: data.phone_numbers,
              event: eventTypeField.name,
              event_id: data.event_type_id,
              public_notes: data.public_notes,
              private_notes: data.private_notes,
            },
            date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          },
        ])
      ),
    });

    await transaction.commit();

    return response;
  } catch (error) {
    await transaction.rollback();
    logger.error(
      `Error saving agenda reserve with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(error);
  }
};

const updateAgendaReserve = async (where, data) => {
  const transaction = await db.transaction();

  try {
    if (data.phone_numbers) {
      data.phone_numbers = JSON.stringify(data.phone_numbers);
    }

    const { participants, ...reserveData } = data;

    if (participants) {
      const [reserveField] = await transaction("agenda_reserves").where(where);
      for (const participant of (data.participants.added || [])) {
        await transaction("agenda_reserves_accounts").insert({
          agenda_reserve_id: reserveField.uuid_unique,
          account_id: participant,
        });
      }

      for (const participant of (data.participants.removed || [])) {
        await transaction("agenda_reserves_accounts").where({
          agenda_reserve_id: reserveField.uuid_unique,
          account_id: participant,
        }).del();
      }
    }

    if (!reserveData || Object.keys(reserveData).length == 0) {
      await transaction.commit();
      return 1;
    } else {
      logger.info(
        `Updating agenda reserve with where: ${JSON.stringify(
          where
        )}, data: ${JSON.stringify(data)}`
      );

      const response = await transaction("agenda_reserves")
        .where(where)
        .update(reserveData);

      await transaction.commit();
      return response;
    }
  } catch (error) {
    await transaction.rollback();
    logger.error(
      `Error updating agenda reserve with where: ${JSON.stringify(
        where
      )}, data: ${JSON.stringify(data)}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const deleteAgendaReserve = async (id) => {
  try {
    logger.info(`Deleting agenda reserve with id: ${id}`);

    return await db("agenda_reserves").where({ "agenda_reserves.uuid_unique": id }).del();
  } catch (error) {
    logger.error(
      `Error deleting agenda reserve with id: ${id}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const getAgendaLinksByField = async (data, isRaw = false) => {
  try {
    const query = db("agenda_links")
      .select(
        "agenda_links.*",
        "agenda_reserves.name as reserve_name",
        "agenda_reserves.date as reserve_date",
        "agenda_event_types.name as event_type_name",
        "agenda_event_types.duration as event_type_duration"
      )
      .leftJoin("agenda_reserves", "agenda_reserves.uuid_unique", "agenda_links.reserve_id")
      .leftJoin("agenda_event_types", "agenda_event_types.uuid_unique", "agenda_reserves.event_type_id");

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
      `Error getting agenda links with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const saveAgendaLink = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    logger.info(`Saving agenda link with data: ${JSON.stringify(data)}`);

    const [linkId] = await db("agenda_links").insert(data);

    const response = linkId
      ? (await getAgendaLinksByField({ "agenda_links.id": linkId }))[0]
      : false;

    return response;
  } catch (error) {
    logger.error(
      `Error saving agenda link with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const updateAgendaLink = async (where, data) => {
  try {
    logger.info(`Updating agenda link with where: ${JSON.stringify(where)}, data: ${JSON.stringify(data)}`);

    return await db("agenda_links").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating agenda link with where: ${JSON.stringify(
        where
      )}, data: ${JSON.stringify(data)}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const deleteAgendaLink = async (id) => {
  try {
    logger.info(`Deleting agenda link with id: ${id}`);

    return await db("agenda_links").where({ "agenda_links.uuid_unique": id }).del();
  } catch (error) {
    logger.error(
      `Error deleting agenda link with id: ${id}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const getAgendaEventTypeByField = async (data, isRaw = false) => {
  try {
    const query = db("agenda_event_types");

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
      `Error getting agenda event type with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const saveAgendaEventType = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    logger.info(`Saving agenda event type with data: ${JSON.stringify(data)}`);

    const [eventTypeId] = await db("agenda_event_types").insert(data);

    const response = eventTypeId
      ? (await getAgendaEventTypeByField({ "agenda_event_types.id": eventTypeId }))[0]
      : false;

    return response;
  } catch (error) {
    logger.error(
      `Error saving agenda event type with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const updateAgendaEventType = async (where, data) => {
  try {
    logger.info(`Updating agenda event type with where: ${JSON.stringify(where)}, data: ${JSON.stringify(data)}`);

    return await db("agenda_event_types").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating agenda event type with where: ${JSON.stringify(where)}, data: ${JSON.stringify(data)}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const deleteAgendaEventType = async (id) => {
  try {
    logger.info(`Deleting agenda event type with id: ${id}`);

    return await db("agenda_event_types").where({ "agenda_event_types.uuid_unique": id }).del();
  } catch (error) {
    logger.error(
      `Error deleting agenda event type with id: ${id}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const getAgendaBlockedHoursByField = async (data, isRaw = false) => {
  try {
    const query = db("agenda_blocked_hours");

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
      `Error getting agenda blocked hours with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    return [];
  }
};

const saveAgendaBlockedHours = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    logger.info(`Saving agenda blocked hours with data: ${JSON.stringify(data)}`);

    const [agendaID] = await db("agenda_blocked_hours").insert(data);

    const response = agendaID
      ? (await getAgendaBlockedHoursByField({ "agenda_blocked_hours.id": agendaID }))[0]
      : false;

    return response;
  } catch (error) {
    logger.error(
      `Error saving agenda blocked hours with data: ${JSON.stringify(data)}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const updateAgendaBlockedHours = async (where, data) => {
  try {
    logger.info(`Updating agenda blocked hours with where: ${JSON.stringify(where)}, data: ${JSON.stringify(data)}`);

    return await db("agenda_blocked_hours").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating agenda blocked hours with where: ${JSON.stringify(where)}, data: ${JSON.stringify(data)}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const deleteAgendaBlockedHours = async (id) => {
  try {
    logger.info(`Deleting agenda blocked hours with id: ${id}`);

    return await db("agenda_blocked_hours").where({ "agenda_blocked_hours.uuid_unique": id }).del();
  } catch (error) {
    logger.error(
      `Error deleting agenda blocked hours with id: ${id}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const getAgendaReserveLogsByField = async (data, isRaw = false) => {
  try {
    const query = db("agenda_reserves_logs");

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
      `Error getting agenda logs with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

const saveAgendaReserveLog = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;
    data.data = JSON.stringify(data.data);

    logger.info(`Saving agenda reserve log with data: ${JSON.stringify(data)}`);

    const [logId] = await db("agenda_reserves_logs").insert(data);

    const response = logId
      ? (await getAgendaReserveLogsByField({ "agenda_reserves_logs.id": logId }))[0]
      : false;

    return response;
  } catch (error) {
    logger.error(
      `Error saving agenda reserve log with data: ${JSON.stringify(data)}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

const updateAgendaReserveLog = async (where, data) => {
  try {
    data.data = JSON.stringify(data.data);

    logger.info(`Updating agenda reserve log with where: ${JSON.stringify(where)}, data: ${JSON.stringify(data)}`);

    return await db("agenda_reserves_logs").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating agenda reserve log with where: ${JSON.stringify(where)}, data: ${JSON.stringify(data)}, error: ${error.message}`
    );
    throw new Error(error);
  }
}

module.exports = {
  getAgendaReserveByField,
  getAgendaReserveAccountsByField,
  getAgendaReserveStatusByField,
  saveAgendaReserve,
  updateAgendaReserve,
  deleteAgendaReserve,
  getAgendaLinksByField,
  saveAgendaLink,
  updateAgendaLink,
  deleteAgendaLink,
  getAgendaEventTypeByField,
  saveAgendaEventType,
  updateAgendaEventType,
  deleteAgendaEventType,
  getAgendaBlockedHoursByField,
  saveAgendaBlockedHours,
  updateAgendaBlockedHours,
  deleteAgendaBlockedHours,
  getAgendaReserveLogsByField,
  saveAgendaReserveLog,
  updateAgendaReserveLog,
};