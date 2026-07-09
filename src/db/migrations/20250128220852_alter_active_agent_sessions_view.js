/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`DROP VIEW IF EXISTS active_agent_sessions;`);

  await knex.raw(`
    CREATE VIEW active_agent_sessions AS
    SELECT
        qch.uuid_unique AS queue_chat_id,
        qch.contact_id,
        qch.status,
        sl.uuid_unique AS session_log_id,
        sl.asesor_id AS agent_id
    FROM
        call_center_queue_chats qch
    JOIN
        call_center_sessions_logs sl ON qch.session_id = sl.uuid_unique
    WHERE
        qch.status IN ('ASSIGNED', 'IN_PROGRESS')
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("DROP VIEW IF EXISTS active_agent_sessions;");
};
