/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex("company_configs").where({ key: "SCREENSHOT_WORD" }).update({
    key: "SCREENSHOT_SERVICE",
    data: "false",
    data_type: "boolean",
    description: "SCREENSHOT SERVICE",
  });

  await knex("extensions").where({ key: "SCREENSHOT_WORD" }).update({
    key: "SCREENSHOT_SERVICE",
    name: "Screenshot Service",
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex("company_configs").where({ key: "SCREENSHOT_SERVICE" }).update({
    key: "SCREENSHOT_WORD",
    data: "true",
    data_type: "boolean",
    description: "SCREENSHOT WORD",
  });

  await knex("extensions").where({ key: "SCREENSHOT_SERVICE" }).update({
    key: "SCREENSHOT_WORD",
    name: "Screenshot Word",
  });
};
