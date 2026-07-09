/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("social_messages_queue", (table) => {
    table
      .enu("direction", ["inbound", "outbound"])
      .nullable()
  });
};

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("social_messages_queue", (table) => {
    table.dropColumn("direction");
  });
};
