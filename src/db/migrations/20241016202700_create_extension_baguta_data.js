const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName).insert({
    key: "BAGUTA_DATA",
    name: "Baguta Data",
    icon: "FaDatabase",
    description: {
      english: "Bot can connect to a external database and get information about it.",
      spanish: "Bot can connect to an external database and get information about it.",
    },
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName).where({ key: "BAGUTA_DATA" }).del();
};
