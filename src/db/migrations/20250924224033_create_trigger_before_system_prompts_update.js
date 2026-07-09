const tableName = "system_prompts";
const backupTable = "system_prompts_backup";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE TRIGGER before_system_prompts_update
    BEFORE UPDATE ON ${tableName}
    FOR EACH ROW
    BEGIN
        -- 1. Insert the backup
        INSERT INTO ${backupTable} (
            original_id,
            \`key\`,
            name,
            prompt_data,
            parent_id,
            metadata,
            created_by,
            created_at,
            updated_at,
            backed_up_at
        )
        VALUES (
            OLD.id,
            OLD.\`key\`,
            OLD.name,
            OLD.prompt_data,
            OLD.parent_id,
            OLD.metadata,
            OLD.created_by,
            OLD.created_at,
            OLD.updated_at,
            NOW()
        );
        
        -- 2. Clean up old backups immediately in the same trigger
        DELETE FROM ${backupTable}
        WHERE original_id = OLD.id
          AND id NOT IN (
            SELECT * FROM (
              SELECT id
              FROM ${backupTable}
              WHERE original_id = OLD.id
              ORDER BY backed_up_at DESC
              LIMIT 3
            ) AS keep_recent
          );
    END
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP TRIGGER IF EXISTS before_system_prompts_update`);
};
