/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE EVENT delete_old_queue_messages
    ON SCHEDULE EVERY 1 DAY
    DO DELETE FROM social_messages_queue
    WHERE created_at < NOW() - INTERVAL 7 DAY;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
