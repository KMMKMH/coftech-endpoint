const tableName = "company_configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex("raffle_company_configs")
    .where({ key: "BOT_MAKER_ACCESS_TOKEN" })
    .del();

  const companies = await knex("company").select("uuid_unique as company_id");

  for (const { company_id } of companies) {
    const [existConfig] = await knex(tableName).where({
      key: "BOT_MAKER_ACCESS_TOKEN",
      company_id,
    });

    if (!existConfig) {
      await knex(tableName).insert({
        company_id,
        key: "BOT_MAKER_ACCESS_TOKEN",
        data: "",
        data_type: "string",
        description: "Access token for Bot Maker",
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName).where({ key: "BOT_MAKER_ACCESS_TOKEN" }).del();
};
