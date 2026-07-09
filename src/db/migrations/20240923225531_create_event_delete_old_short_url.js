/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE EVENT delete_old_short_url
    ON SCHEDULE EVERY 1 DAY
    DO DELETE FROM short_url
    WHERE status=false
    OR (status=true AND expiration_time < NOW());`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("DROP EVENT delete_old_short_url");
};
