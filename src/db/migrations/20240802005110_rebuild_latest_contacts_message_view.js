/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`DROP VIEW IF EXISTS latest_contacts_message`);

  await knex.raw(`
    CREATE VIEW latest_contacts_message AS
      WITH LatestMessages AS (
          SELECT
              sender,
              network_id,
              client_id,
              MAX(created_at) AS latest_message_time
          FROM
              social_messages
          WHERE
              via = 'receive'
          AND is_group = 0
          AND is_broadcast = 0
          GROUP BY
              sender, network_id, client_id
      )
      SELECT
          lm.sender,
          lm.network_id,
          lm.client_id,
          lm.latest_message_time,
          sc.picture,
          sc.contact_id,
          b.company_id,
          b.name AS bot_name,
          b.identifier AS bot_identifier,
          sn.name AS network_name,
          sn.key AS network_key
      FROM
          LatestMessages lm
      INNER JOIN social_contacts sc ON lm.sender = sc.uuid_unique
      INNER JOIN social_networks sn ON lm.network_id = sn.uuid_unique
      INNER JOIN bots b ON lm.client_id = b.uuid_unique;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP VIEW latest_contacts_message`);
};
