const tableName = "company_configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const response = await knex(tableName).where({ key: "OPENAI_KEY" });

  for (const record of response) {
    await knex(tableName).insert({
      company_id: record.company_id,
      extension: record.extension,
      bot_id: record.bot_id,
      data_type: "float",
      data_options: JSON.stringify({
        min: 0,
        max: 2,
      }),
      key: "GTP_TEMPERATURE",
      data: "1",
      description: "Set the temperature of the GTP",
      internal: 0,
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
