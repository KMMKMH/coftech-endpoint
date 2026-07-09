/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE VIEW agent_availability AS
    SELECT
        agents.agent_id,
        agents.department_id,
        agents.stock,
        COUNT(sessions.session_log_id) AS total_sessions,
        CASE
            WHEN COUNT(sessions.session_log_id) < agents.stock THEN TRUE
            ELSE FALSE
        END AS isAvailable
    FROM
        call_center_departments_agents agents
    LEFT JOIN
        active_agent_sessions sessions ON agents.agent_id = sessions.agent_id
    GROUP BY
        agents.agent_id, agents.department_id, agents.stock
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP VIEW IF EXISTS agent_availability;`);
};
