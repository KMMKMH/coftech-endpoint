const tableName = "payments_provider";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName).where({ name: "Paya¡" }).update({ name: "Yappy" });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName).where({ name: "Yappy" }).update({ name: "Paya¡" });
};
