/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const [results] = await knex.raw(
    `
    WITH plans_extensions_configs AS (
      SELECT 
        pe.plan_id,
        ct.uuid_unique AS config_template_id,
        ct.data_default,
        ct.extension_id
      FROM plans_extensions pe 
      INNER JOIN configs_templates ct 
        ON pe.extension_id = ct.extension_id
    )
    SELECT
      b.uuid_unique AS bot_id,
      b.name AS bot_name,
      b.company_id,
      cc.uuid_unique AS company_config_uuid,
      pec.data_default AS data_default,
      pec.extension_id,
      pec.config_template_id
    FROM bots b
    LEFT JOIN plans_extensions_configs pec 
      ON b.plan_id = pec.plan_id
    LEFT JOIN company_configs cc 
      ON pec.config_template_id = cc.config_template_id
      AND b.company_id = cc.company_id
      AND b.uuid_unique = cc.bot_id
    WHERE cc.uuid_unique IS NULL
    `
  );

  const companyConfigsToInsert = results.map((row) => ({
    bot_id: row.bot_id,
    company_id: row.company_id,
    data: row.data_default,
    config_template_id: row.config_template_id,
  }));

  await knex("company_configs").insert(companyConfigsToInsert);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const [results] = await knex.raw(
    `
    WITH plans_extensions_configs AS (
      SELECT 
        pe.plan_id,
        ct.uuid_unique AS config_template_id,
        ct.data_default,
        ct.extension_id
      FROM plans_extensions pe 
      INNER JOIN configs_templates ct 
        ON pe.extension_id = ct.extension_id
    )
    SELECT
      b.uuid_unique AS bot_id,
      b.company_id,
      pec.config_template_id
    FROM bots b
    LEFT JOIN plans_extensions_configs pec 
      ON b.plan_id = pec.plan_id
    `
  );

  const companyConfigsToDelete = results.map((row) => ({
    bot_id: row.bot_id,
    company_id: row.company_id,
    config_template_id: row.config_template_id,
  }));

  for (const config of companyConfigsToDelete) {
    await knex("company_configs")
      .where({
        bot_id: config.bot_id,
        company_id: config.company_id,
        config_template_id: config.config_template_id,
      })
      .del();
  }
};
