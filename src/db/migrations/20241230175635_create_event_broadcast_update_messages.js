/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE EVENT update_limbo_messages_to_broadcast
    ON SCHEDULE EVERY 1 WEEK
    DO
      UPDATE social_messages
      SET is_broadcast = 1
      WHERE is_broadcast = 0
      AND message_id IS NULL
      AND JSON_EXTRACT(data, '$._data.id.remote') = 'status@broadcast';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("DROP EVENT update_limbo_messages_to_broadcast");
};
