/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE VIEW analytics_company_general
    AS
    SELECT
      (SELECT COUNT(uuid_unique) FROM company) AS total_companies,
      (SELECT COUNT(uuid_unique) FROM company WHERE status = 0) AS total_inactive_companies,
      (SELECT COUNT(uuid_unique) FROM company WHERE status = 1) AS total_active_companies,
      (SELECT COUNT(uuid_unique) FROM orders) AS total_orders;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP VIEW analytics_company_general`);
};
