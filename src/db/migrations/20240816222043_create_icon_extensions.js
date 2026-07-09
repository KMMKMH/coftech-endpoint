const tableName = "extensions";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName)
    .where({ key: "SCREENSHOT_WORD" })
    .update({ icon: "FaCamera" });

  await knex(tableName)
    .where({ key: "OPEN_AI_SERVICE" })
    .update({ icon: "FaRobot" });

  await knex(tableName)
    .where({ key: "HUMANIZE_RESPONSE" })
    .update({ icon: "FaKeyboard" });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
