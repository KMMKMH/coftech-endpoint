const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName).insert({
    key: "SCREENSHOT_DATA",
    name: "Screenshot Data",
    icon: "FaCalendarCheck",
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
