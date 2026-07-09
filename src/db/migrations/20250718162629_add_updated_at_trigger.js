const {
  createUpdatedAtTrigger,
  dropUpdatedAtTrigger,
} = require("../../utils/updatedAtTrigger");

const getTablesByKey = async (knex, key) => {
  const tables = await knex("information_schema.columns")
    .select("c.table_name")
    .from("information_schema.columns AS c")
    .innerJoin("information_schema.tables AS t", function () {
      this.on("c.table_name", "=", "t.table_name")
        .andOn("c.table_schema", "=", "t.table_schema")
        .andOn("t.table_catalog", "=", "c.table_catalog");
    })
    .where("c.column_name", "=", key)
    .andWhere("t.table_type", "=", "BASE TABLE")
    .andWhereRaw("c.table_schema = DATABASE()");

  return tables.map((table) => table.TABLE_NAME);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const tables = await getTablesByKey(knex, "updated_at");

  if (tables.length === 0) {
    return;
  }

  for (const table of tables) {
    await knex.raw(createUpdatedAtTrigger(table));
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const tables = await getTablesByKey(knex, "updated_at");

  if (tables.length === 0) {
    return;
  }

  for (const table of tables) {
    await knex.raw(dropUpdatedAtTrigger(table));
  }
};
