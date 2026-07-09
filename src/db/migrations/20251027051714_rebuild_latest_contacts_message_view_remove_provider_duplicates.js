/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`DROP VIEW IF EXISTS latest_contacts_message`);

  await knex.raw(`
    CREATE VIEW latest_contacts_message AS
      SELECT
          sc.uuid_unique AS contact_uuid,
          sc.contact_id,
          sc.picture,
          sc.metadata,
          lm.network_id,
          lm.client_id,
          lm.sn_provider_id,
          lm.latest_message_time,
          b.company_id,
          b.name AS bot_name,
          b.identifier AS bot_identifier,
          sn.name AS network_name,
          sn.key AS network_key,
          snp.name AS provider_name,
          snp.key AS provider_key
      FROM (
          SELECT
              sm1.sender,
              sm1.network_id,
              sm1.client_id,
              sm1.sn_provider_id,
              sm1.created_at AS latest_message_time
          FROM social_messages sm1
          INNER JOIN (
              SELECT
                  sender,
                  network_id,
                  client_id,
                  MAX(id) AS max_id
              FROM social_messages
              WHERE
                  via = 'receive'
                  AND is_group = 0
                  AND is_broadcast = 0
              GROUP BY sender, network_id, client_id
          ) sm2 ON sm1.id = sm2.max_id
      ) AS lm
      INNER JOIN social_contacts sc ON lm.sender = sc.contact_id
      INNER JOIN social_networks sn ON lm.network_id = sn.uuid_unique
      INNER JOIN bots b ON lm.client_id = b.uuid_unique
      INNER JOIN social_networks_providers snp ON lm.sn_provider_id = snp.uuid_unique;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP VIEW IF EXISTS latest_contacts_message`);

  await knex.raw(`
    CREATE VIEW latest_contacts_message AS
      SELECT
          sc.uuid_unique AS contact_uuid,
          sc.contact_id,
          sc.picture,
          sc.metadata,
          lm.network_id,
          lm.client_id,
          lm.sn_provider_id,
          lm.latest_message_time,
          b.company_id,
          b.name AS bot_name,
          b.identifier AS bot_identifier,
          sn.name AS network_name,
          sn.key AS network_key,
          snp.name AS provider_name,
          snp.key AS provider_key
      FROM (
          SELECT
              sender,
              network_id,
              client_id,
              sn_provider_id,
              MAX(created_at) AS latest_message_time
          FROM social_messages
          WHERE
              via = 'receive'
              AND is_group = 0
              AND is_broadcast = 0
          GROUP BY sender, network_id, client_id, sn_provider_id
      ) AS lm
      INNER JOIN social_contacts sc ON lm.sender = sc.contact_id
      INNER JOIN social_networks sn ON lm.network_id = sn.uuid_unique
      INNER JOIN bots b ON lm.client_id = b.uuid_unique
      INNER JOIN social_networks_providers snp ON lm.sn_provider_id = snp.uuid_unique;
  `);
};
