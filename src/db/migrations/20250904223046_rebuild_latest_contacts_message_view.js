/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`DROP VIEW IF EXISTS latest_contacts_message`);

  await knex.raw(`
    CREATE VIEW latest_contacts_message AS
      SELECT
          lm.sender,
          lm.network_id,
          lm.client_id,
          lm.sn_provider_id,
          lm.latest_message_time,
          sc.picture,
          sc.contact_id,
          sc.metadata,
          b.company_id,
          b.name AS bot_name,
          b.identifier AS bot_identifier,
          sn.name AS network_name,
          sn.key AS network_key
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

  const [idx1] = await knex.raw(
    `SHOW INDEX FROM social_messages WHERE Key_name = 'idx_social_messages_sender_network_client_provider'`
  );
  if (idx1.length === 0) {
    await knex.raw(`
      CREATE INDEX idx_social_messages_sender_network_client_provider 
      ON social_messages (sender(191), network_id(191), client_id(191), sn_provider_id(191))
    `);
  }

  const [idx2] = await knex.raw(
    `SHOW INDEX FROM social_messages WHERE Key_name = 'idx_social_messages_created_at'`
  );
  if (idx2.length === 0) {
    await knex.raw(`
      CREATE INDEX idx_social_messages_created_at 
      ON social_messages (created_at)
    `);
  }

  const [idx3] = await knex.raw(
    `SHOW INDEX FROM social_contacts WHERE Key_name = 'idx_social_contacts_contact_id'`
  );
  if (idx3.length === 0) {
    await knex.raw(`
      CREATE INDEX idx_social_contacts_contact_id 
      ON social_contacts (contact_id)
    `);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP VIEW IF EXISTS latest_contacts_message`);

  const [idx1] = await knex.raw(
    `SHOW INDEX FROM social_messages WHERE Key_name = 'idx_social_messages_sender_network_client_provider'`
  );
  if (idx1.length > 0) {
    await knex.raw(
      `DROP INDEX idx_social_messages_sender_network_client_provider ON social_messages`
    );
  }

  const [idx2] = await knex.raw(
    `SHOW INDEX FROM social_messages WHERE Key_name = 'idx_social_messages_created_at'`
  );
  if (idx2.length > 0) {
    await knex.raw(
      `DROP INDEX idx_social_messages_created_at ON social_messages`
    );
  }

  const [idx3] = await knex.raw(
    `SHOW INDEX FROM social_contacts WHERE Key_name = 'idx_social_contacts_contact_id'`
  );
  if (idx3.length > 0) {
    await knex.raw(
      `DROP INDEX idx_social_contacts_contact_id ON social_contacts`
    );
  }
};
