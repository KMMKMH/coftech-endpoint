const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "call_center_agents_quick_responses";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("agent_id").notNullable();
    table.string("department_id").notNullable();
    table.text("response", "mediumtext").notNullable();
    table.string("response_hash", 64).notNullable();
    table.string("title").nullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);

    table.foreign("agent_id").references("uuid_unique").inTable("accounts");
    table
      .foreign("department_id")
      .references("uuid_unique")
      .inTable("call_center_departments");
  });

  await knex.raw(up(tableName));

  await knex.raw(
    `ALTER TABLE ${tableName} ADD CONSTRAINT uniq_agent_dept_resp_hash UNIQUE (agent_id, department_id, response_hash)`
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
