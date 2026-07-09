const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "call_center_departments_agents";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) AUTO_INCREMENT NOT NULL").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("department_id").notNullable();
    table.string("agent_id").notNullable();
    table.timestamps(true, true);

    table
      .foreign("department_id")
      .references("uuid_unique")
      .inTable("call_center_departments");
    table.foreign("agent_id").references("uuid_unique").inTable("accounts");
  });

  await knex.raw(up(tableName));

  await knex.raw(`
    ALTER TABLE ${tableName} ADD CONSTRAINT unique_department_agent UNIQUE (department_id, agent_id);`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
