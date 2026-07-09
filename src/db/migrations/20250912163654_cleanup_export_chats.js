const tableName = "export_chats";
const eventName = "cleanup_export_chats";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.index(["status", "processed_at"], "idx_status_processed_at");
    table.index(["status", "updated_at"], "idx_status_updated_at");
    table.index(["status", "created_at"], "idx_status_created_at");
  });

  await knex.raw(`DROP EVENT IF EXISTS ${eventName};`);

  await knex.raw(`
    CREATE EVENT ${eventName}
    ON SCHEDULE
      EVERY 6 HOUR
      STARTS TIMESTAMP(CURRENT_DATE, '01:00:00')
    ON COMPLETION PRESERVE
    DO
    BEGIN
      DELETE FROM ${tableName}
      WHERE status = 'COMPLETE'
        AND processed_at < (NOW() - INTERVAL 24 HOUR);

      DELETE FROM ${tableName}
      WHERE status IN ('FAILED', 'CANCELLED')
        AND updated_at < (NOW() - INTERVAL 24 HOUR);

      UPDATE ${tableName}
      SET status = 'FAILED',
          error_message = 'Process queued for more than 2 hours, possible processor failure'
      WHERE status IN ('QUEUE', 'PROCESSING')
        AND updated_at < (NOW() - INTERVAL 2 HOUR);
    END;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropIndex(["status", "processed_at"], "idx_status_processed_at");
    table.dropIndex(["status", "updated_at"], "idx_status_updated_at");
    table.dropIndex(["status", "created_at"], "idx_status_created_at");
  });

  await knex.raw(`DROP EVENT IF EXISTS ${eventName};`);
};
