/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE EVENT auto_confirm_pending_bookings
    ON SCHEDULE EVERY 1 MINUTE
    DO UPDATE booking_reminders
    SET 
      status = (SELECT uuid_unique FROM booking_reminders_status WHERE name = 'confirmed'),
      is_auto_confirmed = true
    WHERE status = (SELECT uuid_unique FROM booking_reminders_status WHERE name = 'pending')
    AND is_reminder_sent = true AND TIMESTAMPDIFF(MINUTE, booking_reminders.created_at, NOW()) >= 15;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP EVENT IF EXISTS auto_confirm_pending_bookings`);
};
