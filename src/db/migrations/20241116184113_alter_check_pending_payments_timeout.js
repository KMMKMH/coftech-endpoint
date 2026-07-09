/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`DROP EVENT IF EXISTS check_pending_payments_timeout`);

  await knex.raw(`
    CREATE EVENT check_pending_payments_timeout
    ON SCHEDULE EVERY 1 MINUTE
    DO 
    UPDATE payments p
    INNER JOIN short_url s
      ON JSON_EXTRACT(p.metadata,'$.payment_link') = s.generated_url
    LEFT JOIN payments_status ps_pending 
      ON ps_pending.name = 'pending'
    LEFT JOIN payments_status ps_timeout 
      ON ps_timeout.name = 'timeout'
    SET p.status = ps_timeout.uuid_unique
    WHERE p.status = ps_pending.uuid_unique
      AND s.expiration_time < NOW()
      AND p.metadata IS NOT NULL;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("DROP EVENT check_pending_payments_timeout");
};
