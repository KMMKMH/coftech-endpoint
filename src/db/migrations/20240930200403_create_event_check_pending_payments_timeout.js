/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE EVENT check_pending_payments_timeout
    ON SCHEDULE EVERY 1 MINUTE
    DO UPDATE payments
    SET status = (SELECT uuid_unique FROM payments_status WHERE name = 'timeout')
    WHERE status = (SELECT uuid_unique FROM payments_status WHERE name = 'pending')
    AND created_at < NOW() - INTERVAL 10 MINUTE;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("DROP EVENT check_pending_payments_timeout");
};
