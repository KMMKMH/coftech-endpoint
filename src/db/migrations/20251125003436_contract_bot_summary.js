/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    ALTER VIEW bot_summary AS
    SELECT
      smq.bot_id,
      COUNT(*) AS total_messages,
      COUNT(DISTINCT sender) AS total_senders,
      DATE(CONVERT_TZ(smq.created_at, "+00:00", cc.data)) AS message_date
    FROM
      social_messages_queue smq
    INNER JOIN
      company_configs cc ON smq.bot_id = cc.bot_id
    INNER JOIN
      configs_templates ct ON cc.config_template_id = ct.uuid_unique
    WHERE ct.key = "BOT_TIMEZONE" 
    GROUP BY
      smq.bot_id,
      DATE(CONVERT_TZ(smq.created_at, "+00:00", cc.data))
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`
    ALTER VIEW bot_summary AS
      SELECT
          bot_id,
          COUNT(*) AS total_messages,
          COUNT(DISTINCT sender) AS total_senders,
          DATE(created_at) AS message_date
      FROM
          social_messages_queue
      GROUP BY
          bot_id,
          DATE(created_at)
  `);
};
