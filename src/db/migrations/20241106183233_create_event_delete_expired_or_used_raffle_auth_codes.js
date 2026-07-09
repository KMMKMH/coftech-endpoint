/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
      CREATE EVENT delete_expired_or_used_raffle_auth_codes
      ON SCHEDULE EVERY 1 DAY
      DO DELETE FROM raffle_auth_codes
      WHERE status="expired"
      OR status="used"
      OR (status="active" AND expiration_time < NOW());`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(
    "DROP EVENT create_event_delete_expired_or_used_raffle_auth_codes"
  );
};
