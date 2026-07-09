const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "filemanager_types";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("key").notNullable().unique();
    table.string("name").notNullable().unique();
    table.boolean("is_rag_compatible").notNullable().defaultTo(false);
  });

  await knex.raw(up(tableName));

  await knex(tableName).insert([
    { id: 1, key: "PDF", name: "pdf", is_rag_compatible: true },
    { id: 2, key: "DOCX", name: "docx", is_rag_compatible: true },
    { id: 3, key: "TXT", name: "txt", is_rag_compatible: true },
    { id: 4, key: "PNG", name: "png", is_rag_compatible: false },
    { id: 5, key: "JPG", name: "jpg", is_rag_compatible: false },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
