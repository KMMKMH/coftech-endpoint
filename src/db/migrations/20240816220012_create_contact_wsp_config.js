const tableName = "configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName).insert([
    {
      key: "WP_BOT_CONTACT",
      data: "",
      description: "Numero de whatsapp del bot coftech",
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
