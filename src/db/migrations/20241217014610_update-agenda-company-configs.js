const tableName = 'agenda_company_configs';
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const companies = await knex('company');
  await knex(tableName).where({ key: 'MEET_OVERLAP' }).del();

  const configs = [
    {
      key: "OVERLAP_MODE",
      data: "GLOBAL",
      description: "Overlap Mode",
      data_type: "string",
      data_options: [
        { value: "INDIVIDUAL", label: "Individual" },
        { value: "GLOBAL", label: "Global" },
      ],
    },
    {
      key: "OVERLAP_LIMIT",
      data: 1,
      description: "Amount of allowed overlap between reserves when mode is set to GLOBAL. 0 for unlimited.",
      data_type: "integer",
    }
  ];

  for (const company of companies) {
    for (const config of configs) {
      await knex(tableName).insert({
        company_id: company.uuid_unique,
        key: config.key,
        data: config.data,
        description: config.description,
        data_type: config.data_type,
        data_options: JSON.stringify(config.data_options),
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex(tableName).where({ key: 'OVERLAP_MODE' }).del();
  await knex(tableName).where({ key: 'OVERLAP_LIMIT' }).del();

  const companies = await knex("company");
  for (const company of companies) {
    await knex(tableName).insert({
      company_id: company.uuid_unique,
      key: 'MEET_OVERLAP',
      data: 1,
      description: 'Meet Overlap',
      data_type: 'integer',
    });
  }
};
