const logger = require("../../logger");

const repoCallCenter = require("../../../repositories/callcenter");

const monitorQueueAssingAgent = async () => {
  try {
    const queueChats = await repoCallCenter.getCallCenterQueueChatsByField(
      (builder) => {
        builder
          .where("call_center_queue_chats.status", "PENDING")
          .orWhere("call_center_queue_chats.status", "TRANSFERRED");
      }
    );

    if (!queueChats.length) {
      throw new Error(
        "Queue chats not found with status PENDING or TRANSFERRED."
      );
    }

    for (const queueChat of queueChats) {
      const {
        department_id: departmentID,
        uuid_unique: queueChatID,
        contact_id: contactID,
        status,
        session_id: existingSessionID,
      } = queueChat;

      const agents = await repoCallCenter.getDepartmentAgentsByField({
        "call_center_departments_agents.department_id": departmentID,
      });

      if (!agents.length) {
        throw new Error("Agents not found for department.");
      }

      const sessionsTodayByAgents = await Promise.all(
        agents.map(async (agent) => {
          const { agent_id: agentID } = agent;

          const hasSession = await repoCallCenter.getActiveAgentSessions(
            agentID
          );
          return {
            ...agent,
            totalSessions: hasSession.length,
          };
        })
      );

      const selectedAgent = selectAgentRoundRobin(sessionsTodayByAgents);

      if (!selectedAgent || !Object.keys(selectedAgent).length) {
        throw new Error("No agents available to assign.");
      }

      const { agent_id: selectedAgentID } = selectedAgent;

      if (status !== "TRANSFERRED") {
        const [sessionLogField] =
          await repoCallCenter.saveCallCenterSessionsLog({
            "call_center_sessions_logs.asesor_id": selectedAgentID,
            "call_center_sessions_logs.contact_id": contactID,
          });

        if (!sessionLogField) {
          throw new Error("Error saving session log.");
        }

        const { uuid_unique: sessionID } = sessionLogField;

        await repoCallCenter.updateCallCenterQueueChat(
          { "call_center_queue_chats.uuid_unique": queueChatID },
          { status: "ASSIGNED", session_id: sessionID }
        );
      } else {
        await repoCallCenter.updateCallCenterSessionsLog(
          {
            "call_center_sessions_logs.uuid_unique": existingSessionID,
          },
          { "call_center_sessions_logs.asesor_id": selectedAgentID }
        );
        await repoCallCenter.updateCallCenterQueueChat(
          { "call_center_queue_chats.uuid_unique": queueChatID },
          { status: "ASSIGNED" }
        );
      }
    }
  } catch (error) {
    logger.error(`Error in monitorQueueAssingAgent: ${error.message}`);
  }
};

let lastPriorityIndex = 0;
let lastNonPriorityIndex = 0;
let nextGroup = "priority";

const selectAgentRoundRobin = (agents) => {
  const availableAgents = agents.filter(
    (agent) => agent.totalSessions < agent.stock
  );

  if (!availableAgents.length) {
    return null;
  }

  const priorityAgents = availableAgents.filter((agent) => agent.is_priority);
  const nonPriorityAgents = availableAgents.filter(
    (agent) => !agent.is_priority
  );

  let selectedAgent = null;

  if (nextGroup === "priority" && priorityAgents.length > 0) {
    selectedAgent = priorityAgents[lastPriorityIndex];
    lastPriorityIndex = (lastPriorityIndex + 1) % priorityAgents.length;
    nextGroup = "nonPriority";
  } else if (nonPriorityAgents.length > 0) {
    selectedAgent = nonPriorityAgents[lastNonPriorityIndex];
    lastNonPriorityIndex =
      (lastNonPriorityIndex + 1) % nonPriorityAgents.length;
    nextGroup = "priority";
  } else if (priorityAgents.length > 0) {
    selectedAgent = priorityAgents[lastPriorityIndex];
    lastPriorityIndex = (lastPriorityIndex + 1) % priorityAgents.length;
  }

  return selectedAgent;
};

module.exports = monitorQueueAssingAgent;
