/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`DROP PROCEDURE IF EXISTS sp_calculate_bot_hours;`);

  await knex.raw(`
    CREATE PROCEDURE sp_calculate_bot_hours(
      IN p_start_date DATE,
      IN p_end_date DATE
    )
    BEGIN
      INSERT INTO bot_active_hours_daily (
        bot_id,
        date,
        timezone,
        first_message_at,
        last_message_at,
        total_duration_seconds,
        sessions_count,
        messages_count,
        updated_at
      )
      WITH bot_timezones AS (
        SELECT
          cc.bot_id,
          COALESCE(cc.data, 'America/Panama') as timezone_final
        FROM company_configs cc
        JOIN configs_templates ct ON cc.config_template_id = ct.uuid_unique
        WHERE ct.\`key\` = 'BOT_TIMEZONE'
      ),
      messages_with_timezone AS (
        SELECT
          sm.client_id,
          sm.to_send,
          bt.timezone_final as bot_timezone,
          CONVERT_TZ(sm.created_at, 'UTC', bt.timezone_final) as created_at_local,
          DATE(CONVERT_TZ(sm.created_at, 'UTC', bt.timezone_final)) as date_local
        FROM social_messages sm
        INNER JOIN bot_timezones bt ON sm.client_id = bt.bot_id
        WHERE sm.via = 'send'
          AND sm.is_group = 0
          AND sm.is_broadcast = 0
          AND sm.created_at BETWEEN (p_start_date - INTERVAL 1 DAY) AND (p_end_date + INTERVAL 1 DAY)
          AND DATE(CONVERT_TZ(sm.created_at, 'UTC', bt.timezone_final))
              BETWEEN p_start_date AND p_end_date
      ),
      daily_stats AS (
        SELECT
          m.client_id,
          m.bot_timezone,
          m.date_local,
          MIN(m.created_at_local) as first_message,
          MAX(m.created_at_local) as last_message,
          TIMESTAMPDIFF(SECOND, MIN(m.created_at_local), MAX(m.created_at_local)) as total_duration,
          COUNT(*) as total_messages,
          COUNT(DISTINCT m.to_send) as unique_users_count
        FROM messages_with_timezone m
        GROUP BY m.client_id, m.bot_timezone, m.date_local
      )
      SELECT
        ds.client_id,
        ds.date_local,
        ds.bot_timezone,
        ds.first_message,
        ds.last_message,
        ds.total_duration,
        ds.unique_users_count,
        ds.total_messages,
        NOW()
      FROM daily_stats ds
      ON DUPLICATE KEY UPDATE
        timezone = VALUES(timezone),
        first_message_at = VALUES(first_message_at),
        last_message_at = VALUES(last_message_at),
        total_duration_seconds = VALUES(total_duration_seconds),
        sessions_count = VALUES(sessions_count),
        messages_count = VALUES(messages_count),
        updated_at = NOW();
    END
  `);

  const today = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(today.getDate() - 90);
  const formatDate = (d) => d.toISOString().split('T')[0];

  await knex.raw(`CALL sp_calculate_bot_hours(?, ?)`, [
    formatDate(ninetyDaysAgo),
    formatDate(today)
  ]);

  await knex.raw(`DROP EVENT IF EXISTS event_update_bot_hours`);

  await knex.raw(`
    CREATE EVENT event_update_bot_hours
    ON SCHEDULE EVERY 1 DAY
    STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 2 HOUR)
    DO
      CALL sp_calculate_bot_hours(
        DATE_SUB(CURDATE(), INTERVAL 1 DAY),
        DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      );
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP EVENT IF EXISTS event_update_bot_hours`);
  await knex.raw(`DROP PROCEDURE IF EXISTS sp_calculate_bot_hours`);
};
