/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex("extensions").where({ key: "GTP_SPEECH_TO_SPEECH" }).update({
    key: "GPT_SPEECH_TO_SPEECH",
  });

  await knex("company_configs").where({ key: "GTP_TEMPERATURE" }).update({
    key: "GPT_TEMPERATURE",
  });
  
  await knex("company_configs").where({ key: "GTP_SPEECH_TO_SPEECH" }).update({
    key: "GPT_SPEECH_TO_SPEECH",
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
