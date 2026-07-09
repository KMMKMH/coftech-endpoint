/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE EVENT update_lottery_status
    ON SCHEDULE EVERY 1 HOUR
    DO
      UPDATE raffle_lottery
      SET status = CASE
        WHEN start_date > NOW() THEN 'INACTIVE'
        WHEN end_date < NOW() THEN 'COMPLETED'
        WHEN NOW() BETWEEN start_date AND end_date THEN 'IN_PROGRESS'
        ELSE status
      END
      WHERE status NOT IN ('STOPPED', 'CANCELLED');
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("DROP EVENT update_lottery_status");
};
