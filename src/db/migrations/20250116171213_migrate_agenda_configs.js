const { up, down } = require('../../utils/uuid_v4_trigger');
const tableName = 'agenda_company_configs';
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const agenda_configs = await knex(tableName);

  for (const config of agenda_configs) {
    const [templateID] = await knex('configs_templates').insert({
      owner_type: 'agenda',
      key: config.key,
      data_default: config.key === 'OVERLAP_MODE' ? 'GLOBAL' : 1,
      data_type: config.data_type,
      data_options: config.data_options ? JSON.stringify(config.data_options) : null,
      description: config.description,
    });
    const [templateField] = await knex('configs_templates').where({ id: templateID });

    await knex('company_configs').insert({
      company_id: config.company_id,
      config_template_id: templateField.uuid_unique,
      data: config.data,
    });
  }

  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id");
    table.string("key");
    table.string("data");
    table.string("data_type");
    table.json("data_options");
    table.string("description");
  });

  await knex.raw(up(tableName));

  const configs = await knex("company_configs")
    .join(
      "configs_templates",
      "company_configs.config_template_id",
      "configs_templates.uuid_unique"
    )
    .where("configs_templates.owner_type", "agenda")
    .select(
      "company_configs.company_id",
      "configs_templates.key",
      "configs_templates.data_type",
      "configs_templates.data_options",
      "configs_templates.description",
      "company_configs.data"
    );

  for (const config of configs) {
    await knex(tableName).insert({
      key: config.key,
      data_type: config.data_type,
      data_options: config.data_options
        ? JSON.stringify(config.data_options)
        : null,
      description: config.description,
      company_id: config.company_id,
      data: config.data,
    });
  }

  await knex("company_configs")
    .whereIn("config_template_id", function () {
      this.select("uuid_unique")
        .from("configs_templates")
        .where("owner_type", "agenda");
    })
    .del();

  await knex("configs_templates").where("owner_type", "agenda").del();
};
