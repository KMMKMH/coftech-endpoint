/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex("social_contacts").del();
  await knex("social_messages").del();
  await knex.raw("DROP TRIGGER IF EXISTS social_contacts_before_insert_uuid");

  await knex.schema.alterTable("social_contacts", (table) => {
    table.longtext("picture").defaultTo(false);
  });

  await knex.raw(`
    CREATE FUNCTION social_ensure_contact_exists_to_send(to_send VARCHAR(255), network_id VARCHAR(255), company_id VARCHAR(255)) RETURNS VARCHAR(255)
    READS SQL DATA
    BEGIN
      DECLARE contact_uuid VARCHAR(255);

      SELECT uuid_unique INTO contact_uuid
      FROM social_contacts
      WHERE contact_id = to_send
      AND network_id = network_id
      AND company_id = company_id
      LIMIT 1;

      IF contact_uuid IS NULL THEN
        SET contact_uuid = uuid_v4();
        INSERT INTO social_contacts (uuid_unique, contact_id, network_id, company_id)
        VALUES (contact_uuid, to_send, network_id, company_id);
      END IF;

      RETURN contact_uuid;
    END
  `);

  await knex.raw(`
    CREATE TRIGGER social_messages_before_insert_to_send BEFORE INSERT ON social_messages
    FOR EACH ROW
    BEGIN
      SET NEW.to_send = social_ensure_contact_exists_to_send(NEW.to_send, NEW.network_id, NEW.company_id);
    END
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function () {};
