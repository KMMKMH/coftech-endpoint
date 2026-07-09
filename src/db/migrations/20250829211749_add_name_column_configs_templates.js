const tableName = "configs_templates";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasName = await knex.schema.hasColumn(tableName, "name");
  if (!hasName) {
    await knex.schema.alterTable(tableName, (table) => {
      table.string("name", 255).after("key").nullable();
    });

    const rows = await knex(tableName).select("key");

    for (const row of rows) {
      const humanized = row.key
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      await knex(tableName).where({ key: row.key }).update({ name: humanized });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const hasName = await knex.schema.hasColumn(tableName, "name");
  if (hasName) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn("name");
    });
  }
};
