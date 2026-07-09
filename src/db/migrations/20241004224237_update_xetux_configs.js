/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const extension = await knex("extensions").where({ key: "XETUX" }).first();
  const botsWithXetux = await knex("bots_extensions").where({ extension: extension.uuid_unique });
  
  for (const bot of botsWithXetux) {
    const company = await knex("bots").select("company_id").where({ uuid_unique: bot.bot_id }).first();

    await knex("company_configs").insert({
      company_id: company.company_id,
      bot_id: bot.bot_id,
      extension: extension.uuid_unique,
      key: "XETUX_TABLE_BALANCE_SUMMARY",
      data: "",
      description: "BALANCE SUMMARY table ID",
      data_type: "string",
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex("company_configs").where({ key: "XETUX_TABLE_BALANCE_SUMMARY" }).del();
};
