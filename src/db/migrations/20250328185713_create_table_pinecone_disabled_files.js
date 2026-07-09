const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = 'pinecone_disabled_files';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) AUTO_INCREMENT NOT NULL").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("company_id").notNullable();
    table.string("bot_id").notNullable();
    table.string("file_id").notNullable();
    table.timestamps(true, true);

    table.foreign('company_id').references('uuid_unique').inTable('company');
    table.foreign("bot_id").references("uuid_unique").inTable("bots");
    table.foreign("file_id").references("uuid_unique").inTable("filemanager_files").onDelete("CASCADE");
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
