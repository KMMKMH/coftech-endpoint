const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName).insert({
    key: "DEMO_PAYMENTS",
    name: "Demo Payments",
    icon: "FaCashRegister",
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
