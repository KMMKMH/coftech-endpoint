const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "file_manager_types";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("key").notNullable().unique();
    table.string("name").notNullable().unique();
  });

  await knex.raw(up(tableName));

  await knex(tableName).insert([
    { id: 1, key: "PDF", name: "pdf" },
    { id: 2, key: "DOCX", name: "docx" },
    { id: 3, key: "PNG", name: "png" },
    { id: 4, key: "XLSX", name: "xlsx" },
    { id: 5, key: "JPG", name: "jpg" },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
