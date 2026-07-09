/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  knex.schema.table("social_messages", function (table) {
    table.dropIndex(
      ["sender", "to_send", "client_id", "created_at"],
      "idx_social_messages_sender_composite"
    );
    table.dropIndex(
      ["to_send", "sender", "client_id", "created_at"],
      "idx_social_messages_to_send_composite"
    );
  });

  await knex.raw(
    `CREATE INDEX idx_social_messages_composite ON social_messages (client_id(36), network_id(36), sn_provider_id(36), sender(20), to_send(20), created_at DESC)`
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  knex.schema.table("social_messages", function (table) {
    table.index(
      ["sender", "to_send", "client_id", "created_at"],
      "idx_social_messages_sender_composite"
    );
    table.index(
      ["to_send", "sender", "client_id", "created_at"],
      "idx_social_messages_to_send_composite"
    );
  });

  await knex.raw(`DROP INDEX idx_social_messages_composite ON social_messages`);
};
