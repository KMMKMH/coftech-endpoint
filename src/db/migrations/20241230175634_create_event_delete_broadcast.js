/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE EVENT delete_broadcast_messages
    ON SCHEDULE EVERY 1 DAY
    DO
      DELETE FROM social_messages WHERE is_broadcast = 1;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("DROP EVENT delete_broadcast_messages");
};
