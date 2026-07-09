const tableName = "configs_templates";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex(tableName).where({ key: "GPT_MODEL" }).update({
    data_type: "enum",
    data_options: JSON.stringify([
      { value: "chatgpt-4o-latest", label: "GPT Latest Model" },
      { value: "gpt-4o", label: "GPT 4o" },
      { value: "gpt-4o-mini", label: "GPT 4o mini" },
      { value: "o1", label: "GPT o1" },
      { value: "o1-mini", label: "GPT o1 mini" },
    ])
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex(tableName).where({ key: "GPT_MODEL" }).update({
    data_type: "string",
    data_options: null,
  });
};
