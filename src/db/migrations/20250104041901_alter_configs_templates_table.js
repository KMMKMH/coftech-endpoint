const tableName = "configs_templates";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName)
    .where({
      owner_type: "extension",
      key: "SCREENSHOT_DATA",
    })
    .update({
      data_default: JSON.stringify([
        {
          status: "false",
          name: "your name here",
          prompt: "your prompt here",
          fields: [],
          group: "your group here",
        },
      ]),
      data_type: "json_array",
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName)
    .where({
      owner_type: "extension",
      key: "SCREENSHOT_DATA",
    })
    .update({
      data_default: JSON.stringify({
        status: "false",
        name: "your name here",
        prompt: "your prompt here",
        fields: [],
        group: "your group here",
      }),
      data_type: "json",
    });
};
