/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(
    `CREATE VIEW v_bots_extensions AS
      SELECT
        DENSE_RANK() OVER (ORDER BY uuid_unique) AS id,
        uuid_unique,
        bot_id,
        company_id,
        extension_id,
        status
      FROM (
        SELECT
          b.uuid_unique AS bot_id,
          b.company_id,
          pe.extension_id,
          ext.status AS status,
          pe.uuid_unique
        FROM bots b
        LEFT JOIN plans p ON p.uuid_unique = b.plan_id
        LEFT JOIN plans_extensions pe ON pe.plan_id = p.uuid_unique
        INNER JOIN extensions ext ON ext.uuid_unique = pe.extension_id

        UNION ALL
      
        SELECT
          b.uuid_unique AS bot_id,
          b.company_id,
          ebe.extension_id,
          ebe.status AS status,
          ebe.uuid_unique
        FROM bots b
        LEFT JOIN extra_bots_extensions ebe ON ebe.bot_id = b.uuid_unique
      ) AS combined
   `
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP VIEW IF EXISTS v_bots_extensions`);
};
