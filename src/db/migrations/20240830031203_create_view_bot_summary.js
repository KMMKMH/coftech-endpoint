/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE VIEW bot_summary AS
      SELECT
          bot_id,
          COUNT(*) AS total_messages,
          COUNT(DISTINCT sender) AS total_senders,
          DATE(created_at) AS message_date
      FROM
          social_messages_queue
      GROUP BY
          bot_id,
          DATE(created_at);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP VIEW bot_summary`);
};
