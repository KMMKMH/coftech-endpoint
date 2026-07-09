const tableName = "agenda_event_types";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.integer("duration_temp");
  });

  const rows = await knex(tableName).select("id", "duration");
  for (const row of rows) {
    const [hours, minutes] = row.duration.split(":").map(Number);
    const durationInMinutes = hours * 60 + minutes;
    await knex(tableName)
      .where("id", row.id)
      .update({ duration_temp: durationInMinutes });
  }

  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn("duration");
    table.renameColumn("duration_temp", "duration");
  });

  await knex.schema.alterTable(tableName, (table) => {
    table.integer("duration").notNullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.time("duration_temp");
  });

  const rows = await knex(tableName).select("id", "duration");
  for (const row of rows) {
    const hours = Math.floor(row.duration / 60);
    const minutes = row.duration % 60;
    const timeValue = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    await knex(tableName)
      .where("id", row.id)
      .update({ duration_temp: timeValue });
  }

  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn("duration");
    table.renameColumn("duration_temp", "duration");
  });

  await knex.schema.alterTable(tableName, (table) => {
    table.time("duration").notNullable().alter();
  });
};
