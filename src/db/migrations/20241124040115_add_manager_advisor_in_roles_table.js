const tableName = "roles";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName).insert([
    {
      key: "ADVISOR",
      name: "Advisor",
    },
    {
      key: "MANAGER",
      name: "Manager",
    }
  ]);
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName).where({ key: "ADVISOR" }).del();
};
