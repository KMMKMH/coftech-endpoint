const tableName = "call_center_queue_chats";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table
      .enu("status", [
        "PENDING",
        "ASSIGNED",
        "IN_PROGRESS",
        "CLOSED",
        "TIMEOUT",
        "CANCELED",
        "REASSIGNED",
        "TRANSFERRED",
      ])
      .defaultTo("PENDING")
      .alter();
  });

  await knex.raw(`DROP VIEW IF EXISTS  active_agent_sessions;`);

  await knex.raw(`
    CREATE VIEW active_agent_sessions AS
    SELECT
        qch.uuid_unique AS queue_chat_id,
        qch.contact_id,
        qch.department_id,
        qch.status,
        sl.uuid_unique AS session_log_id,
        sl.asesor_id AS agent_id,
        cd.company_id,
        sc.contact_id as phone
    FROM
        call_center_queue_chats qch
    JOIN
        call_center_sessions_logs sl ON qch.session_id = sl.uuid_unique
    LEFT JOIN
        call_center_departments cd ON qch.department_id = cd.uuid_unique
    LEFT JOIN
        social_contacts sc ON qch.contact_id = sc.uuid_unique
    WHERE
        qch.status IN ('ASSIGNED', 'IN_PROGRESS', 'REASSIGNED');
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table
      .enu("status", [
        "PENDING",
        "ASSIGNED",
        "IN_PROGRESS",
        "CLOSED",
        "TIMEOUT",
        "CANCELED",
      ])
      .defaultTo("PENDING")
      .alter();
  });

  await knex.raw(`DROP VIEW IF EXISTS active_agent_sessions;`);
};
