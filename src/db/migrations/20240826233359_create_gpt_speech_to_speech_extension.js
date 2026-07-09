const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName).insert({
    key: "GTP_SPEECH_TO_SPEECH",
    name: "Speech to Speech",
    icon: "FaHeadset",
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
