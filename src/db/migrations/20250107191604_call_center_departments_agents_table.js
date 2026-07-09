const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "call_center_departments_agents";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.dropTableIfExists("call_center_departments_agents");
  await knex.schema.dropTableIfExists("call_center_departments_managers");
  
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) AUTO_INCREMENT NOT NULL").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("department_id").notNullable();
    table.string("agent_id").notNullable();
    table.integer("stock").unsigned().notNullable().defaultTo(1);
    table.boolean("is_priority").notNullable().defaultTo(false);
    table.timestamps(true, true);

    table.foreign("agent_id").references("uuid_unique").inTable("accounts");
    table
      .foreign("department_id")
      .references("uuid_unique")
      .inTable("call_center_departments");
  });

  await knex.raw(up(tableName));

  await knex.raw(`
    ALTER TABLE ${tableName} ADD CONSTRAINT unique_agent_department_constraint UNIQUE (agent_id, department_id);`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
