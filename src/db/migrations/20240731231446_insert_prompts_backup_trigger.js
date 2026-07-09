/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
	CREATE TRIGGER before_prompts_update
	BEFORE UPDATE ON prompts
	FOR EACH ROW
	BEGIN
		INSERT INTO prompts_backup (uuid_unique, company_id, bot_id, data, name, status, created_at, updated_at)
		VALUES (OLD.uuid_unique, OLD.company_id, OLD.bot_id, OLD.data, OLD.name, OLD.status, OLD.created_at, OLD.updated_at);
		
		DELETE FROM prompts_backup
		WHERE id NOT IN (
			SELECT id FROM (
				SELECT id FROM prompts_backup
				WHERE bot_id = OLD.bot_id
				ORDER BY updated_at DESC
				LIMIT 5
			) AS subquery
		) AND bot_id = OLD.bot_id;
	END;`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP TRIGGER before_prompts_update`);
};
