/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex("company_configs")
    .where({
      key: "ELEVENLABS_MODEL",
    })
    .update({
      data_type: "enum",
    });

  await knex("company_configs")
    .where({
      key: "ELEVENLABS_LANGUAGE",
    })
    .update({
      data_type: "enum",
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex("company_configs")
    .where({
      key: "ELEVENLABS_MODEL",
    })
    .update({
      data_type: "string",
    });

  await knex("company_configs")
    .where({
      key: "ELEVENLABS_LANGUAGE",
    })
    .update({
      data_type: "string",
    });
};
