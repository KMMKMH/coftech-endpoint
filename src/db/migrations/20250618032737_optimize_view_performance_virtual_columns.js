/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE social_messages
      ADD COLUMN revoked_message_id VARCHAR(64)
        GENERATED ALWAYS AS (
          JSON_UNQUOTE(JSON_EXTRACT(extra2, '$.revoked.message_id'))
        ) VIRTUAL,
      ADD COLUMN is_revoked_flag VARCHAR(10)
        GENERATED ALWAYS AS (
          JSON_UNQUOTE(JSON_EXTRACT(extra2, '$.revoked.is_revoked'))
        ) VIRTUAL,
      ADD INDEX idx_revoked_message_id (revoked_message_id),
      ADD INDEX idx_is_revoked_flag (is_revoked_flag);
  `);

  await knex.raw(`
    ALTER TABLE social_messages
      ADD INDEX idx_client_created (client_id, created_at DESC),
      ADD INDEX idx_conversation (client_id, sender, to_send),
      ADD INDEX idx_flags_client (is_group, is_broadcast, client_id),
      ADD INDEX idx_sender_client (sender, client_id),
      ADD INDEX idx_receiver_client (to_send, client_id);
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW vw_social_messages_final AS
    SELECT
        final.id,
        final.uuid_unique,
        final.message_id,
        final.client_id,
        final.sender,
        final.to_send,
        final.created_at,
        final.updated_at,
        final.via,
        final.category,
        final.is_group,
        final.is_broadcast,
        CASE
            WHEN final.type = 'chat' THEN 'text'
            WHEN final.type = 'image' THEN 'image'
            WHEN final.type = 'video' THEN 'video'
            WHEN final.type IN ('audio', 'ptt') THEN 'audio'
            WHEN final.type = 'document' THEN 'document'
            WHEN final.type = 'location' THEN 'location'
            WHEN final.type = 'vcard' THEN 'contact'
            WHEN final.type = 'sticker' THEN 'sticker'
            WHEN final.type = 'event_creation' THEN 'event_message'
            ELSE 'unknown'
        END AS type,
        CASE
            WHEN JSON_EXTRACT(final.extra1, '$.location') IS NOT NULL
            OR JSON_EXTRACT(final.extra1, '$.event') IS NOT NULL
            OR JSON_EXTRACT(final.extra1, '$.contact') IS NOT NULL
            THEN NULL
            ELSE COALESCE(edit.body, final.body)
        END AS body,
        JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.caption')) AS caption,
        CASE
            WHEN JSON_EXTRACT(final.extra1, '$.location') IS NOT NULL
            THEN JSON_OBJECT(
                'metadata_type', 'location',
                'latitude', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.latitude')),
                'longitude', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.longitude')),
                'name', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.name')),
                'url', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.url')),
                'description', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.description'))
            )
            WHEN JSON_EXTRACT(final.extra1, '$.contact') IS NOT NULL
            THEN JSON_OBJECT(
                'metadata_type', 'contact',
                'fullName', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.contact.fullName')),
                'phoneInternational', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.contact.phoneInternational')),
                'phoneType', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.contact.phoneType')),
                'phoneWaid', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.contact.phoneWaid'))
            )
            WHEN JSON_EXTRACT(final.data, '$.extraData.mediaData.filesize') IS NOT NULL
            OR JSON_EXTRACT(final.data, '$.extraData.mediaData.filename') IS NOT NULL
            OR JSON_EXTRACT(final.data, '$.extraData.mediaData.mimetype') IS NOT NULL
            THEN JSON_OBJECT(
                'metadata_type', 'media',
                'filesize', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.filesize')),
                'filename', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.filename')),
                'mimetype', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.mimetype'))
            )
            ELSE NULL
        END AS metadata
    FROM social_messages final
    -- Optimized LATERAL JOIN using virtual column
    LEFT JOIN LATERAL (
        SELECT body
        FROM social_messages edit
        WHERE edit.edited_message_id = final.message_id
        ORDER BY edit.created_at DESC
        LIMIT 1
    ) edit ON TRUE
    WHERE final.edited_message_id IS NULL
      AND NOT (final.is_revoked_flag = 'true' AND final.revoked_message_id IS NOT NULL)
    ORDER BY final.id DESC;
  `);

  await knex.raw('ANALYZE TABLE social_messages;');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw('DROP VIEW IF EXISTS vw_social_messages_final;');

  await knex.raw(`
    ALTER TABLE social_messages
      DROP INDEX idx_client_created,
      DROP INDEX idx_conversation,
      DROP INDEX idx_flags_client,
      DROP INDEX idx_sender_client,
      DROP INDEX idx_receiver_client;
  `);

  await knex.raw(`
    ALTER TABLE social_messages
      DROP INDEX idx_revoked_message_id,
      DROP INDEX idx_is_revoked_flag,
      DROP COLUMN revoked_message_id,
      DROP COLUMN is_revoked_flag;
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW vw_social_messages_final AS
    SELECT
        final.id,
        final.message_id,
        final.uuid_unique,
        final.sender,
        final.to_send,
        final.created_at,
        final.updated_at,
        final.client_id,
        final.via,
        final.category,
        final.extra1,
        COALESCE(revoker.extra2, final.extra2) AS extra2,
        final.extra3,
        final.is_group,
        final.is_broadcast,
        CASE
            WHEN final.type = 'chat' THEN 'text'
            WHEN final.type = 'image' THEN 'image'
            WHEN final.type = 'video' THEN 'video'
            WHEN final.type IN ('audio', 'ptt') THEN 'audio'
            WHEN final.type = 'document' THEN 'document'
            WHEN final.type = 'location' THEN 'location'
            WHEN final.type = 'vcard' THEN 'contact'
            WHEN final.type = 'sticker' THEN 'sticker'
            WHEN final.type = 'event_creation' THEN 'event_message'
            ELSE 'unknown'
        END AS normalized_type,
        COALESCE(edit.body, final.body) AS body_final,
        JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.caption')) AS caption,
        CASE
            WHEN final.type IN ('image', 'video', 'audio', 'ptt', 'document', 'sticker') THEN JSON_OBJECT(
                'metadata_type', CASE WHEN final.type IN ('audio', 'ptt') THEN 'audio' ELSE final.type END,
                'filename', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.filename')),
                'filesize', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.filesize')),
                'mimetype', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.mimetype'))
            )
            WHEN final.type = 'location' THEN JSON_OBJECT(
                'metadata_type', 'location',
                'latitude', JSON_EXTRACT(final.extra1, '$.location.latitude'),
                'longitude', JSON_EXTRACT(final.extra1, '$.location.longitude'),
                'description', JSON_EXTRACT(final.extra1, '$.location.description')
            )
            WHEN final.type = 'event_creation' THEN JSON_OBJECT(
                'metadata_type', 'event_message',
                'name', JSON_EXTRACT(final.extra1, '$.event.name'),
                'start', JSON_EXTRACT(final.extra1, '$.event.start'),
                'end', JSON_EXTRACT(final.extra1, '$.event.end'),
                'location', JSON_EXTRACT(final.extra1, '$.event.location'),
                'description', JSON_EXTRACT(final.extra1, '$.event.description'),
                'link', JSON_EXTRACT(final.extra1, '$.event.link')
            )
            WHEN final.type = 'vcard' THEN JSON_OBJECT(
                'metadata_type', 'contact',
                'fullName', JSON_EXTRACT(final.extra1, '$.contact.fullName'),
                'phoneInternational', JSON_EXTRACT(final.extra1, '$.contact.phoneInternational'),
                'phoneType', JSON_EXTRACT(final.extra1, '$.contact.phoneType'),
                'phoneWaid', JSON_EXTRACT(final.extra1, '$.contact.phoneWaid')
            )
            ELSE NULL
        END AS metadata,
        (
            SELECT sm_quoted.uuid_unique
            FROM social_messages sm_quoted
            WHERE sm_quoted.message_id = JSON_UNQUOTE(
                JSON_EXTRACT(
                    COALESCE(edit.extra1, final.extra1), '$.quoted'
                )
            )
            LIMIT 1
        ) AS quoted_message_id,
        CASE WHEN edit.id IS NOT NULL THEN 1 ELSE 0 END AS is_edited,
        CASE WHEN revoker.id IS NOT NULL THEN 1 ELSE 0 END AS is_revoked
    FROM social_messages final
    LEFT JOIN LATERAL (
        SELECT *
        FROM social_messages edit
        WHERE JSON_UNQUOTE(JSON_EXTRACT(edit.extra1, '$.edited')) = final.message_id
        ORDER BY edit.created_at DESC
        LIMIT 1
    ) edit ON TRUE
    LEFT JOIN LATERAL (
        SELECT *
        FROM social_messages sm_revoker
        WHERE JSON_UNQUOTE(JSON_EXTRACT(sm_revoker.extra2, '$.revoked.message_id')) = final.message_id
          AND JSON_UNQUOTE(JSON_EXTRACT(sm_revoker.extra2, '$.revoked.is_revoked')) = 'true'
        LIMIT 1
    ) revoker ON TRUE
    WHERE JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.edited')) IS NULL
      AND NOT (
          JSON_UNQUOTE(JSON_EXTRACT(final.extra2, '$.revoked.is_revoked')) = 'true'
          AND JSON_UNQUOTE(JSON_EXTRACT(final.extra2, '$.revoked.message_id')) IS NOT NULL
      )
    ORDER BY final.created_at ASC;
  `);
};