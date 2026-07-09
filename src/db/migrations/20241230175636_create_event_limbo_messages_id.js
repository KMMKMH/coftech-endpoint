/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE EVENT update_limbo_messages_id
    ON SCHEDULE EVERY 1 WEEK
    DO
      UPDATE social_messages sm
      SET message_id = (
          CASE
              WHEN JSON_EXTRACT(sm.data, '$._data.id.id') IS NOT NULL
                  THEN JSON_UNQUOTE(JSON_EXTRACT(sm.data, '$._data.id.id'))
              ELSE NULL
          END
      )
      WHERE
          is_broadcast = 0
          AND message_id IS NULL
          AND (
              JSON_EXTRACT(sm.data, '$._data.id.id') IS NULL
              OR JSON_EXTRACT(sm.data, '$._data.id.id') IS NOT NULL
          );
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("DROP EVENT update_limbo_messages_id");
};
