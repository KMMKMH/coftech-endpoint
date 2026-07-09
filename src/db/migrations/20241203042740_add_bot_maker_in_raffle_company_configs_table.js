const tableName = "raffle_company_configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const raffleCompanyConfigs = await knex(tableName)
    .select("company_id")
    .distinct();

  for (const { company_id } of raffleCompanyConfigs) {
    await knex(tableName).insert({
      company_id,
      key: "BOT_MAKER_ACCESS_TOKEN",
      data: "",
      description: "Access token for Bot Maker",
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName).where("key", "BOT_MAKER_ACCESS_TOKEN").del();
};
