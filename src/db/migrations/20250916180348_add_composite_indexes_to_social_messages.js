/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('social_messages', function(table) {
    table.index(['sender', 'to_send', 'client_id', 'created_at'], 'idx_social_messages_sender_composite');
    table.index(['to_send', 'sender', 'client_id', 'created_at'], 'idx_social_messages_to_send_composite');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('social_messages', function(table) {
    table.dropIndex(['sender', 'to_send', 'client_id', 'created_at'], 'idx_social_messages_sender_composite');
    table.dropIndex(['to_send', 'sender', 'client_id', 'created_at'], 'idx_social_messages_to_send_composite');
  });
};
