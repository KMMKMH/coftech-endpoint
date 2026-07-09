/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
  await knex.raw(`
    CREATE EVENT update_expired_raffle_auth_codes
    ON SCHEDULE EVERY 1 MINUTE
    DO UPDATE raffle_auth_codes
    SET status="expired"
    WHERE status="active" AND expiration_time < NOW();`);
};

exports.down = async function (knex) {
  await knex.raw("DROP EVENT update_expired_raffle_auth_codes");
};
