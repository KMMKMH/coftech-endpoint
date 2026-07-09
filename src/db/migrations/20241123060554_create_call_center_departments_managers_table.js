const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "call_center_departments_managers";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("manager_id").notNullable();
    table.string("department_id").notNullable();
    table.timestamps(true, true);

    table.foreign("manager_id").references("uuid_unique").inTable("accounts");
    table
      .foreign("department_id")
      .references("uuid_unique")
      .inTable("call_center_departments");
  });

  await knex.raw(up(tableName));

  await knex.raw(`
    ALTER TABLE ${tableName} ADD CONSTRAINT unique_manager_department UNIQUE (manager_id, department_id);`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
