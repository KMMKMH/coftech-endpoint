/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
        CREATE EVENT cleanup_old_auth_codes
        ON SCHEDULE EVERY 1 MINUTE
        DO UPDATE payment_auth_codes
        SET status = 'expired'
        WHERE status = 'active'
        AND created_at < NOW() - INTERVAL 10 MINUTE;
        `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("DROP EVENT cleanup_old_auth_codes");
};
