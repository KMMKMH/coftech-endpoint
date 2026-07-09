const tableName = "configs_templates";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE ${tableName}
    MODIFY COLUMN owner_type ENUM('company', 'extension', 'agenda', 'raffle', 'provider', 'bot') NOT NULL
  `);

  await knex.raw(`
    ALTER TABLE ${tableName}
    DROP CHECK check_owner_type_extension,
    ADD CONSTRAINT check_owner_type_extension CHECK (
      (
        owner_type IN ('company', 'agenda', 'raffle', 'provider', 'bot') 
        AND extension_id IS NULL
      )
      OR 
      (
        owner_type = 'extension' 
        AND extension_id IS NOT NULL
      )
    )
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE ${tableName}
    DROP CHECK check_owner_type_extension,
    ADD CONSTRAINT check_owner_type_extension CHECK (
      (
        owner_type IN ('company', 'agenda', 'raffle', 'provider') 
        AND extension_id IS NULL
      )
      OR 
      (
        owner_type = 'extension' 
        AND extension_id IS NOT NULL
      )
    )
  `);

  await knex.raw(`
    ALTER TABLE ${tableName}
    MODIFY COLUMN owner_type ENUM('company', 'extension', 'agenda', 'raffle', 'provider') NULL
  `);
};
