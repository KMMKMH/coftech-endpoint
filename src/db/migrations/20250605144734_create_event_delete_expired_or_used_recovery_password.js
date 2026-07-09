/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
      CREATE EVENT IF NOT EXISTS delete_expired_or_used_recovery_password
      ON SCHEDULE EVERY 1 DAY
      DO
        DELETE FROM recovery_password
        WHERE status IN ('expired', 'used')
        OR (status = 'active' AND expiration_time < NOW());
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(
    "DROP EVENT IF EXISTS delete_expired_or_used_recovery_password"
  );
};
