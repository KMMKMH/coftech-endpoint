const tableName = "prompts";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const [[fkExists]] = await knex.raw(
    `
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND CONSTRAINT_NAME = ?
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `,
    [tableName, "prompts_bot_id_foreign"]
  );

  if (fkExists.count > 0) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropForeign("bot_id");
    });
  }

  const [[indexExists]] = await knex.raw(
    `
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
      AND NON_UNIQUE = 0
  `,
    [tableName, "bot_id"]
  );

  if (indexExists.count > 0) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropUnique(["bot_id"]);
    });
  }

  await knex.schema.alterTable(tableName, (table) => {
    table
      .foreign("bot_id")
      .references("uuid_unique")
      .inTable("bots")
      .onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.unique("bot_id");
  });
};
