const tableName = "social_messages";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.index("message_id");
  });

  await knex.raw(`
    ALTER TABLE social_messages
      ADD COLUMN edited_message_id VARCHAR(64)
        GENERATED ALWAYS AS (
          JSON_UNQUOTE(JSON_EXTRACT(extra1, '$.edited'))
        ) VIRTUAL,
      ADD INDEX idx_edited_message_id (edited_message_id);
  `);

  await knex.raw(`
    CREATE OR REPLACE
    VIEW vw_social_messages_final AS
    SELECT
        m_orig.id,
        m_orig.message_id,
        m_orig.uuid_unique,
        m_orig.sender,
        m_orig.to_send,
        m_orig.created_at,
        m_orig.updated_at,
        m_orig.client_id,
        m_orig.via,
        m_orig.category,
        m_orig.extra1,
        m_orig.extra3,
        m_orig.is_group,
        m_orig.is_broadcast,
        CASE
            WHEN m_orig.type = 'chat' THEN 'text'
            WHEN m_orig.type = 'image' THEN 'image'
            WHEN m_orig.type = 'video' THEN 'video'
            WHEN m_orig.type IN ('audio', 'ptt') THEN 'audio'
            WHEN m_orig.type = 'document' THEN 'document'
            WHEN m_orig.type = 'location' THEN 'location'
            WHEN m_orig.type = 'vcard' THEN 'contact'
            WHEN m_orig.type = 'sticker' THEN 'sticker'
            WHEN m_orig.type = 'event_creation' THEN 'event_message'
            ELSE 'unknown'
        END AS normalized_type,
        CASE
            WHEN JSON_EXTRACT(m_orig.extra1, '$.location') IS NOT NULL
            OR JSON_EXTRACT(m_orig.extra1, '$.event') IS NOT NULL
            OR JSON_EXTRACT(m_orig.extra1, '$.contact') IS NOT NULL
            THEN NULL
            ELSE COALESCE(
                (
                    SELECT sm_edit.body
                    FROM social_messages sm_edit
                    WHERE JSON_UNQUOTE(JSON_EXTRACT(sm_edit.extra1, '$.edited')) = m_orig.message_id
                    ORDER BY sm_edit.created_at DESC
                    LIMIT 1
                ),
                m_orig.body
            )
        END AS body_final,
        JSON_UNQUOTE(JSON_EXTRACT(m_orig.extra1, '$.caption')) AS caption,
        JSON_EXTRACT(m_orig.extra1, '$.location') AS location_json,
        JSON_EXTRACT(m_orig.extra1, '$.contact') AS contact_json,
        JSON_EXTRACT(m_orig.extra1, '$.event') AS event_json,
        CASE
          WHEN JSON_EXTRACT(m_orig.data, '$.extraData.mediaData.filesize') IS NOT NULL
            OR JSON_EXTRACT(m_orig.data, '$.extraData.mediaData.filename') IS NOT NULL
            OR JSON_EXTRACT(m_orig.data, '$.extraData.mediaData.mimetype') IS NOT NULL
          THEN JSON_OBJECT(
            'filesize', JSON_UNQUOTE(JSON_EXTRACT(m_orig.data, '$.extraData.mediaData.filesize')),
            'filename', JSON_UNQUOTE(JSON_EXTRACT(m_orig.data, '$.extraData.mediaData.filename')),
            'mimetype', JSON_UNQUOTE(JSON_EXTRACT(m_orig.data, '$.extraData.mediaData.mimetype'))
          )
          ELSE NULL
        END AS media_json,
        COALESCE(
            (
                SELECT sm_quoted.uuid_unique
                FROM social_messages sm_edit
                JOIN social_messages sm_quoted
                    ON sm_quoted.message_id = JSON_UNQUOTE(JSON_EXTRACT(sm_edit.extra1, '$.quoted'))
                WHERE JSON_UNQUOTE(JSON_EXTRACT(sm_edit.extra1, '$.edited')) = m_orig.message_id
                ORDER BY sm_edit.created_at DESC
                LIMIT 1
            ),
            (
                SELECT sm_quoted.uuid_unique
                FROM social_messages sm_quoted
                WHERE sm_quoted.message_id = JSON_UNQUOTE(JSON_EXTRACT(m_orig.extra1, '$.quoted'))
                LIMIT 1
            )
        ) AS quoted_message_id,
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM social_messages sm_edit
                WHERE JSON_UNQUOTE(JSON_EXTRACT(sm_edit.extra1, '$.edited')) = m_orig.message_id
                LIMIT 1
            ) THEN 1
            ELSE 0
        END AS is_edited
    FROM
        social_messages m_orig
    WHERE
        JSON_UNQUOTE(JSON_EXTRACT(m_orig.extra1, '$.edited')) IS NULL;`)
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`
    DROP VIEW IF EXISTS vw_social_messages_final;
  `);

  await knex.schema.alterTable(tableName, (table) => {
    table.dropIndex("message_id");
  });

  await knex.raw(`
    ALTER TABLE social_messages
    DROP INDEX idx_edited_message_id,
    DROP COLUMN edited_message_id;`
  );
};
