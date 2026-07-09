/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`DROP TRIGGER IF EXISTS social_messages_before_insert;`);
  await knex.raw(`DROP TRIGGER IF EXISTS social_messages_before_insert_to_send;`);

  await knex.raw(`DROP FUNCTION IF EXISTS social_ensure_contact_exists`);
  await knex.raw(`DROP FUNCTION IF EXISTS social_ensure_contact_exists_to_send`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function () {
};
