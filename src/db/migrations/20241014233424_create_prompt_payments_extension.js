const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName).insert({
    key: "PROMPT_PAYMENTS",
    name: "Prompt Payments",
    icon: "FaMoneyCheckAlt",
    description: {
      english: "Bot can generate a payment link for the customer.",
      spanish: "The bot can generate a payment link for the customer.",
    },
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName).where({ key: "PROMPT_PAYMENTS" }).del();
};
