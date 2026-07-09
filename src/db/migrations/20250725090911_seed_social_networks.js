/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const socialNetworks = [
    {
      key: "INSTAGRAM",
      name: "Instagram",
      is_default: false,
      status: true,
    },
    {
      key: "TELEGRAM",
      name: "Telegram",
      is_default: false,
      status: true,
    },
  ];

  await knex("social_networks").insert(socialNetworks);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex("social_networks").whereIn("key", ["INSTAGRAM", "TELEGRAM"]).del();
};
