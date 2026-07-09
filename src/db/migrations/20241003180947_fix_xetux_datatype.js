/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const extension = await knex("extensions").where({ key: "XETUX" }).first();

  await knex("company_configs").where({
    extension: extension.uuid_unique,
    key: "XETUX_PROJECT_ID",
  }).update({ data_type: "string" });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function() {
  
};
