/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
        CREATE EVENT statistics_daily_message_count
        ON SCHEDULE EVERY 1 DAY
        STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL '23:59:00' HOUR_SECOND
        DO
        BEGIN
            INSERT INTO statistics_messages_count (date, company_id, company_name, count_receive, count_sent)
            SELECT
                CURDATE() AS date,
                sm.company_id,
                c.name AS company_name,
                SUM(CASE WHEN sm.via = 'receive' THEN 1 ELSE 0 END) AS count_receive,
                SUM(CASE WHEN sm.via = 'send' THEN 1 ELSE 0 END) AS count_sent
            FROM
                social_messages sm
            INNER JOIN
                company c ON sm.company_id = c.uuid_unique
            WHERE
                DATE(sm.created_at) = CURDATE()
            GROUP BY
                sm.company_id, c.name;
        END;
      `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("DROP EVENT IF EXISTS statistics_daily_message_count;");
};
