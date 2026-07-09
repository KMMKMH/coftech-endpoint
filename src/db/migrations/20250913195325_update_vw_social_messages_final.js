/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
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
      final.extra1,
      COALESCE(revoker.extra2, final.extra2) AS extra2,
      final.extra3,
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
          WHEN JSON_EXTRACT(final.extra1, '$.location') IS NOT NULL THEN JSON_OBJECT(
              'metadata_type', 'location',
              'latitude', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.latitude')),
              'longitude', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.longitude')),
              'name', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.name')),
              'url', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.url')),
              'description', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.description'))
          )
          WHEN JSON_EXTRACT(final.extra1, '$.contact') IS NOT NULL THEN JSON_OBJECT(
              'metadata_type', 'contact',
              'fullName', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.contact.fullName')),
              'phoneInternational', JSON_UNQUOTE(JSON_EXTRACT(final.extra1,
  '$.contact.phoneInternational')),
              'phoneType', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.contact.phoneType')),
              'phoneWaid', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.contact.phoneWaid'))
          )
          WHEN JSON_EXTRACT(final.extra1, '$.event') IS NOT NULL THEN JSON_OBJECT(
              'metadata_type', 'event_message',
              'name', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.name')),
              'start', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.start')),
              'end', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.end')),
              'location', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.location')),
              'description', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.description')),
              'link', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.link'))
          )
          WHEN JSON_EXTRACT(final.data, '$.extraData.mediaData.size') IS NOT NULL
            OR JSON_EXTRACT(final.data, '$.extraData.mediaData.filename') IS NOT NULL
            OR JSON_EXTRACT(final.data, '$.extraData.mediaData.mime_type') IS NOT NULL
          THEN JSON_OBJECT(
              'metadata_type', CASE WHEN final.type IN ('audio', 'ptt') THEN 'audio' ELSE final.type END,
              'filesize', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.size')),
              'filename', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.filename')),
              'mimetype', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.mime_type'))
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
      WHERE edit.edited_message_id = final.message_id
      ORDER BY edit.created_at DESC
      LIMIT 1
  ) edit ON TRUE
  LEFT JOIN LATERAL (
      SELECT *
      FROM social_messages sm_revoker
      WHERE (sm_revoker.revoked_message_id = final.message_id
         OR sm_revoker.revoked_message_id IN (
             SELECT sm_edit.message_id
             FROM social_messages sm_edit
             WHERE sm_edit.edited_message_id = final.message_id
         )
         OR JSON_UNQUOTE(JSON_EXTRACT(sm_revoker.extra2, '$.revoked.message_id')) = final.message_id)
        AND JSON_UNQUOTE(JSON_EXTRACT(sm_revoker.extra2, '$.revoked.is_revoked')) = 'true'
      LIMIT 1
  ) revoker ON TRUE
  WHERE final.edited_message_id IS NULL
     AND final.type <> 'revoked'
  ORDER BY final.id DESC;
`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
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
        final.extra1,
        COALESCE(revoker.extra2, final.extra2) AS extra2,
        final.extra3,
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
            WHEN JSON_EXTRACT(final.extra1, '$.location') IS NOT NULL THEN JSON_OBJECT(
                'metadata_type', 'location',
                'latitude', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.latitude')),
                'longitude', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.longitude')),
                'name', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.name')),
                'url', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.url')),
                'description', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.location.description'))
            )
            WHEN JSON_EXTRACT(final.extra1, '$.contact') IS NOT NULL THEN JSON_OBJECT(
                'metadata_type', 'contact',
                'fullName', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.contact.fullName')),
                'phoneInternational', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.contact.phoneInternational')),
                'phoneType', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.contact.phoneType')),
                'phoneWaid', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.contact.phoneWaid'))
            )
            WHEN JSON_EXTRACT(final.extra1, '$.event') IS NOT NULL THEN JSON_OBJECT(
                'metadata_type', 'event_message',
                'name', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.name')),
                'start', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.start')),
                'end', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.end')),
                'location', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.location')),
                'description', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.description')),
                'link', JSON_UNQUOTE(JSON_EXTRACT(final.extra1, '$.event.link'))
            )
            WHEN JSON_EXTRACT(final.data, '$.extraData.mediaData.filesize') IS NOT NULL
              OR JSON_EXTRACT(final.data, '$.extraData.mediaData.filename') IS NOT NULL
              OR JSON_EXTRACT(final.data, '$.extraData.mediaData.mimetype') IS NOT NULL
            THEN JSON_OBJECT(
                'metadata_type', CASE WHEN final.type IN ('audio', 'ptt') THEN 'audio' ELSE final.type END,
                'filesize', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.filesize')),
                'filename', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.filename')),
                'mimetype', JSON_UNQUOTE(JSON_EXTRACT(final.data, '$.extraData.mediaData.mimetype'))
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
        WHERE edit.edited_message_id = final.message_id
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
    WHERE final.edited_message_id IS NULL
   	AND final.type <> 'revoked'
    ORDER BY final.id DESC;
`);
};
