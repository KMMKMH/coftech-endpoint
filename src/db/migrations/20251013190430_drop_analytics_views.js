/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`DROP VIEW IF EXISTS analytics_company_general;`);
  await knex.raw(`DROP VIEW IF EXISTS analytics_company_specific;`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`
    CREATE VIEW analytics_company_general AS
    SELECT
      (SELECT COUNT(uuid_unique) FROM company) AS total_companies,
      (SELECT COUNT(uuid_unique) FROM company WHERE status = 0) AS total_inactive_companies,
      (SELECT COUNT(uuid_unique) FROM company WHERE status = 1) AS total_active_companies,
      (SELECT COUNT(uuid_unique) FROM orders) AS total_orders;
  `);

  await knex.raw(`
    CREATE VIEW analytics_company_specific AS
      SELECT
        company.uuid_unique AS company_id,
        COUNT(DISTINCT social_contacts.uuid_unique) AS total_contacts,
        COUNT(DISTINCT orders.uuid_unique) AS total_messages,
        COUNT(DISTINCT CASE WHEN social_networks.key = 'WHATSAPP' THEN social_contacts.uuid_unique END) AS total_whatsapp_contacts,
        COUNT(DISTINCT CASE WHEN bots.STATUS = 1 AND bots.suspended = 1 AND bots.identifier IS NOT NULL THEN bots.uuid_unique END) AS active_bots,
        COUNT(DISTINCT accounts.uuid_unique) AS total_accounts,
        COUNT(DISTINCT CASE WHEN bots_extensions.status = 1 THEN bots_extensions.uuid_unique END) AS total_extensions
      FROM 
        company
      LEFT JOIN social_contacts ON social_contacts.company_id = company.uuid_unique
      LEFT JOIN orders ON orders.company_id = company.uuid_unique
      LEFT JOIN social_networks ON social_networks.id = social_contacts.network_id
      LEFT JOIN bots ON bots.company_id = company.uuid_unique
      LEFT JOIN accounts ON accounts.company_id = company.uuid_unique
      LEFT JOIN bots_extensions ON bots_extensions.bot_id = bots.uuid_unique
      GROUP BY company.uuid_unique;
  `);
};
