/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.renameTable("social_contacts", "social_contacts_old");
  await knex.schema.renameTable("social_messages", "social_messages_old");
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.renameTable("social_contacts_old", "social_contacts");
  await knex.schema.renameTable("social_messages_old", "social_messages");
};
