const db = require("../utils/db");
const logger = require("../utils/logger");

const getCallCenterCategoriesByField = async (data, isRaw = false) => {
  try {
    const query = db("call_center_categories")
      .select("call_center_categories.*")
      .select("parent.name AS parent_name")
      .leftJoin(
        "call_center_categories AS parent",
        "call_center_categories.parent_id",
        "parent.uuid_unique"
      );

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
      `Error getting call center categories with data ${JSON.stringify(
        data
      )},error: ${JSON.stringify(error)}`
    );
    throw new Error("Error getting call center categories");
  }
};

const saveCallCenterCategory = async (data) => {
  try {
    logger.info(`saveCallCenterCategory with data: ${JSON.stringify(data)}`);
    const [callCenterCategoryID] = await db("call_center_categories").insert(
      data
    );
    return await getCallCenterCategoriesByField({
      "call_center_categories.id": callCenterCategoryID,
    });
  } catch (error) {
    logger.error(
      `Error saving call center category with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error saving call center category");
  }
};

const updateCallCenterCategory = async (where, data) => {
  try {
    logger.info(`updateCallCenterCategory with data: ${JSON.stringify(data)}`);
    return await db("call_center_categories").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating call center category with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error updating call center category");
  }
};

const deleteCallCenterCategory = async (where) => {
  try {
    logger.info(
      `deleteCallCenterCategory with where: ${JSON.stringify(where)}`
    );
    return await db("call_center_categories").where(where).del();
  } catch (error) {
    logger.error(
      `Error deleting call center category with where ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error deleting call center category");
  }
};

const getCallCenterDepartmentsByField = async (data, isRaw = false) => {
  try {
    const query = db("call_center_departments")
      .select(
        "call_center_departments.*",
        "category.name AS category_name",
        db.raw("COUNT(DISTINCT department_agents.uuid_unique) as total_members")
      )
      .leftJoin(
        "call_center_categories AS category",
        "call_center_departments.category_id",
        "category.uuid_unique"
      )
      .leftJoin(
        "call_center_departments_agents AS department_agents",
        "department_agents.department_id",
        "call_center_departments.uuid_unique"
      )
      .groupBy("call_center_departments.uuid_unique", "category.name");

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
      `Error getting call center departments with data ${JSON.stringify(
        data
      )},error: ${JSON.stringify(error)}`
    );
    throw new Error("Error getting call center departments");
  }
};

const saveCallCenterDepartment = async (data) => {
  try {
    logger.info(`saveCallCenterDepartment with data: ${JSON.stringify(data)}`);
    const [callCenterDepartmentID] = await db("call_center_departments").insert(
      data
    );
    return await getCallCenterDepartmentsByField({
      "call_center_departments.id": callCenterDepartmentID,
    });
  } catch (error) {
    logger.error(
      `Error saving call center department with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error saving call center department");
  }
};

const updateCallCenterDepartment = async (where, data) => {
  try {
    logger.info(
      `updateCallCenterDepartment with data: ${JSON.stringify(data)}`
    );
    return await db("call_center_departments").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating call center department with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error updating call center department");
  }
};

const deleteCallCenterDepartment = async (where) => {
  try {
    logger.info(
      `deleteCallCenterDepartment with where: ${JSON.stringify(where)}`
    );
    return await db("call_center_departments").where(where).del();
  } catch (error) {
    logger.error(
      `Error deleting call center department with where ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error deleting call center department");
  }
};

const getDepartmentAgentsByField = async (data, isRaw = false) => {
  try {
    const query = db("call_center_departments_agents")
      .select(
        "call_center_departments_agents.agent_id",
        "call_center_departments_agents.department_id",
        "call_center_departments_agents.stock",
        "roles.key as role_key",
        "roles.name as role_assinged",
        db.raw(
          "CONCAT(accounts.first_name, ' ', accounts.last_name) AS full_name"
        )
      )
      .leftJoin(
        "accounts",
        "call_center_departments_agents.agent_id",
        "accounts.uuid_unique"
      )
      .leftJoin(
        "account_role",
        "accounts.uuid_unique",
        "account_role.account_id"
      )
      .leftJoin("roles", "account_role.role_id", "roles.uuid_unique")
      .groupBy(
        "call_center_departments_agents.agent_id",
        "call_center_departments_agents.uuid_unique",
        "accounts.first_name",
        "accounts.last_name",
        "roles.key",
        "roles.name"
      );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        if (result.length > 0) {
          const groupedResult = result.reduce((acc, item) => {
            const existingAgent = acc.find(
              (agent) => agent.agent_id === item.agent_id
            );
            if (existingAgent) {
              existingAgent.departments_assigned.push(item.department_id);
            } else {
              acc.push({
                ...item,
                departments_assigned: [item.department_id],
              });
            }
            return acc;
          }, []);
          return groupedResult;
        } else {
          return [];
        }
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting department agents with data ${JSON.stringify(
        data
      )},error: ${JSON.stringify(error)}`
    );
    throw new Error("Error getting department agents");
  }
};

const saveDepartmentAgent = async (data) => {
  try {
    logger.info(`saveDepartmentAgent with data: ${JSON.stringify(data)}`);
    const [agentID] = await db("call_center_departments_agents").insert(data);
    return await getDepartmentAgentsByField({
      "call_center_departments_agents.id": agentID,
    });
  } catch (error) {
    logger.error(
      `Error saving department agent with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error saving department agent");
  }
};

const updateDepartmentAgent = async (where, data) => {
  try {
    logger.info(`updateDepartmentAgent with data: ${JSON.stringify(data)}`);
    return await db("call_center_departments_agents").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating department agent with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error updating department agent");
  }
};

const deleteDepartmentAgent = async (where) => {
  try {
    logger.info(`deleteDepartmentAgent with where: ${JSON.stringify(where)}`);
    return await db("call_center_departments_agents").where(where).del();
  } catch (error) {
    logger.error(
      `Error deleting department agent with where ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error deleting department agent");
  }
};

const getDepartmentScheduleByField = async (data, isRaw = false) => {
  try {
    const query = db("call_center_departments_schedule as dp_schedule");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    console.log(query.toString());

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting call center departments schedule  with data ${JSON.stringify(
        data
      )},error: ${JSON.stringify(error)}`
    );
    throw new Error("Error getting call center departments schedule ");
  }
};

const saveDepartmentSchedule = async (data) => {
  try {
    logger.info(`saveDepartmentSchedule with data: ${JSON.stringify(data)}`);
    const [departmentScheduleID] = await db(
      "call_center_departments_schedule as dp_schedule"
    ).insert(data);
    return await getDepartmentScheduleByField({
      "dp_schedule.id": departmentScheduleID,
    });
  } catch (error) {
    logger.error(
      `Error saving call center departments schedule  with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error saving call center departments schedule ");
  }
};

const deleteDepartmentSchedule = async (where) => {
  try {
    logger.info(
      `deleteDepartmentSchedule with where: ${JSON.stringify(where)}`
    );
    return await db("call_center_departments_schedule as dp_schedule")
      .where(where)
      .del();
  } catch (error) {
    logger.error(
      `Error deleting call center departments schedule  with where ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error deleting call center departments schedule ");
  }
};

const updateDepartmentSchedule = async (where, data) => {
  try {
    logger.info(`updateDepartmentSchedule with data: ${JSON.stringify(data)}`);
    return await db("call_center_departments_schedule as dp_schedule")
      .where(where)
      .update(data);
  } catch (error) {
    logger.error(
      `Error updating call center departments schedule  with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error updating call center departments schedule ");
  }
};

const getDepartmentScheduleOffByField = async (data, isRaw = false) => {
  try {
    const query = db("call_center_departments_schedule_off");

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
      `Error getting call center departments schedule off  with data ${JSON.stringify(
        data
      )},error: ${JSON.stringify(error)}`
    );
    throw new Error("Error getting call center departments schedule off ");
  }
};

const saveDepartmentScheduleOff = async (data) => {
  try {
    logger.info(`saveDepartmentScheduleOff with data: ${JSON.stringify(data)}`);
    return await db("call_center_departments_schedule_off").insert(data);
  } catch (error) {
    logger.error(
      `Error saving call center departments schedule off  with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error saving call center departments schedule off ");
  }
};

const deleteDepartmentScheduleOff = async (where) => {
  try {
    logger.info(
      `deleteDepartmentScheduleOff with where: ${JSON.stringify(where)}`
    );
    return await db("call_center_departments_schedule_off").where(where).del();
  } catch (error) {
    logger.error(
      `Error deleting call center departments schedule off  with where ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error deleting call center departments schedule off ");
  }
};

const updateDepartmentScheduleOff = async (where, data) => {
  try {
    logger.info(
      `updateDepartmentScheduleOff with data: ${JSON.stringify(data)}`
    );
    return await db("call_center_departments_schedule_off")
      .where(where)
      .update(data);
  } catch (error) {
    logger.error(
      `Error updating call center departments schedule off  with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error updating call center departments schedule off ");
  }
};

const getQuickResponsesByField = async (data, isRaw = false) => {
  try {
    const query = db("call_center_agents_quick_responses");

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
      `Error getting quick responses with data ${JSON.stringify(
        data
      )},error: ${JSON.stringify(error)}`
    );
    throw new Error("Error getting quick responses");
  }
};

const saveQuickResponse = async (data) => {
  try {
    logger.info(`saveQuickResponse with data: ${JSON.stringify(data)}`);
    const [quickResponseID] = await db(
      "call_center_agents_quick_responses"
    ).insert(data);
    return await getQuickResponsesByField({
      "call_center_agents_quick_responses.id": quickResponseID,
    });
  } catch (error) {
    logger.error(
      `Error saving quick response with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error saving quick response");
  }
};

const updateQuickResponse = async (where, data) => {
  try {
    logger.info(`updateQuickResponse with data: ${JSON.stringify(data)}`);
    return await db("call_center_agents_quick_responses")
      .where(where)
      .update(data);
  } catch (error) {
    logger.error(
      `Error updating quick response with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error updating quick response");
  }
};

const deleteQuickResponse = async (where) => {
  try {
    logger.info(`deleteQuickResponse with where: ${JSON.stringify(where)}`);
    return await db("call_center_agents_quick_responses").where(where).del();
  } catch (error) {
    logger.error(
      `Error deleting quick response with where ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error deleting quick response");
  }
};

const getCallCenterQueueChatsByField = async (data, isRaw = false) => {
  try {
    const query = db("call_center_queue_chats")
      .select(
        "call_center_queue_chats.*",
        "social_contacts.contact_id as phone"
      )
      .leftJoin(
        "social_contacts",
        "call_center_queue_chats.contact_id",
        "social_contacts.uuid_unique"
      );

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
      `Error getting call center queue chat with data ${JSON.stringify(
        data
      )},error: ${JSON.stringify(error)}`
    );
    throw new Error("Error getting call center queue chat");
  }
};

const saveCallCenterQueueChat = async (data) => {
  try {
    logger.info(`saveCallCenterQueueChat with data: ${JSON.stringify(data)}`);
    const [queueChatID] = await db("call_center_queue_chats").insert(data);
    return await getCallCenterQueueChatsByField({
      "call_center_queue_chats.id": queueChatID,
    });
  } catch (error) {
    logger.error(
      `Error saving call center queue chat with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error saving call center queue chat");
  }
};

const getCallCenterSessionsLogsByField = async (data, isRaw = false) => {
  try {
    const query = db("call_center_sessions_logs");

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
      `Error getting call center sessions logs with data ${JSON.stringify(
        data
      )},error: ${JSON.stringify(error)}`
    );
    throw new Error("Error getting call center sessions logs");
  }
};

const saveCallCenterSessionsLog = async (data) => {
  try {
    logger.info(`saveCallCenterSessionsLog with data: ${JSON.stringify(data)}`);
    const [sessionLogID] = await db("call_center_sessions_logs").insert(data);
    return await getCallCenterSessionsLogsByField({
      "call_center_sessions_logs.id": sessionLogID,
    });
  } catch (error) {
    logger.error(
      `Error saving call center sessions log with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error saving call center sessions log");
  }
};

const updateCallCenterSessionsLog = async (where, data) => {
  try {
    logger.info(
      `updateCallCenterSessionsLog with where: ${JSON.stringify(
        where
      )} ,data: ${JSON.stringify(data)}`
    );
    return await db("call_center_sessions_logs").where(where).update(data);
  } catch (error) {
    logger.error(`
    Error updating call center sessions log with data ${JSON.stringify(data)},
    error: ${JSON.stringify(error)}
    `);
    throw new Error(`Error updating call center sessions log`);
  }
};

const updateCallCenterQueueChat = async (where, data) => {
  try {
    logger.info(`updateCallCenterQueueChat with data: ${JSON.stringify(data)}`);
    return await db("call_center_queue_chats").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating call center queue chat with data ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error("Error updating call center queue chat");
  }
};

const getActiveAgentSessions = async (data, isRaw = false) => {
  try {
    const query = db("active_agent_sessions");

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
      `Error getting active agent sessions with data ${JSON.stringify(
        data
      )},error: ${JSON.stringify(error)}`
    );
    throw new Error("Error getting active agent sessions");
  }
};

const getAgentAvailability = async (data, isRaw = false) => {
  try {
    const query = db("agent_availability");

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
    logger.error(`
      Error getting agent availability with data: ${JSON.stringify(data)},
      error: ${JSON.stringify(error)}`);
    throw new Error("Error getting agent availability");
  }
};

const getClosedChats = async (data, isRaw = false) => {
  try {
    const query = db("closed_chats");

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
      `Error getting closed chats with data ${JSON.stringify(
        data
      )},error: ${JSON.stringify(error)}`
    );
    throw new Error("Error getting closed chats");
  }
};

module.exports = {
  getCallCenterCategoriesByField,
  saveCallCenterCategory,
  updateCallCenterCategory,
  deleteCallCenterCategory,
  getCallCenterDepartmentsByField,
  saveCallCenterDepartment,
  updateCallCenterDepartment,
  deleteCallCenterDepartment,
  getDepartmentAgentsByField,
  saveDepartmentAgent,
  deleteDepartmentAgent,
  getDepartmentScheduleByField,
  saveDepartmentSchedule,
  deleteDepartmentSchedule,
  updateDepartmentSchedule,
  getDepartmentScheduleOffByField,
  saveDepartmentScheduleOff,
  deleteDepartmentScheduleOff,
  updateDepartmentScheduleOff,
  getQuickResponsesByField,
  saveQuickResponse,
  updateQuickResponse,
  deleteQuickResponse,
  updateDepartmentAgent,
  getCallCenterQueueChatsByField,
  saveCallCenterQueueChat,
  updateCallCenterQueueChat,
  getCallCenterSessionsLogsByField,
  saveCallCenterSessionsLog,
  updateCallCenterSessionsLog,
  getActiveAgentSessions,
  getAgentAvailability,
  getClosedChats,
};
