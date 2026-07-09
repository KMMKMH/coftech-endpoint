/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    DROP EVENT IF EXISTS delete_old_queue_messages;
  `);

  await knex.raw(`
    CREATE EVENT delete_old_queue_messages
    ON SCHEDULE EVERY 1 DAY
    DO DELETE FROM social_messages_queue
    WHERE created_at < NOW() - INTERVAL 30 DAY;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`
    DROP EVENT IF EXISTS delete_old_queue_messages;
  `);
};
