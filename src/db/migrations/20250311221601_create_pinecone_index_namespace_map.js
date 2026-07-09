const tableName = "pinecone_index_namespace_map";
const { up, down } = require("../../utils/uuid_v4_trigger");
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) AUTO_INCREMENT NOT NULL").primary();
    table.string("uuid_unique").notNullable();
    table.string("index_id").notNullable();
    table.string("namespace").notNullable();
    table.timestamps(true, true);

    table.unique(["index_id", "namespace"]);
    table.foreign("index_id").references("uuid_unique").inTable("bots");
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
