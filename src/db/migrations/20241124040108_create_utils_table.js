const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "utils";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.string("uuid_unique").unique().notNullable();
    table.string("key").unique().notNullable();
    table.json("data").notNullable();
    table.json("metadata");
    table.timestamps(true, true);
  });

  await knex.raw(up(tableName));

  const daysOfWeek = [
    { names: { en: "Monday", es: "Lunes" }, order: 1 },
    { names: { en: "Tuesday", es: "Martes" }, order: 2 },
    { names: { en: "Wednesday", es: "Wednesday" }, order: 3 },
    { names: { en: "Thursday", es: "Jueves" }, order: 4 },
    { names: { en: "Friday", es: "Viernes" }, order: 5 },
    { names: { en: "Saturday", es: "Saturday" }, order: 6 },
    { names: { en: "Sunday", es: "Domingo" }, order: 7 },
  ];

  await knex(tableName).insert([
    {
      key: "PERIOD_OF_DAY",
      data: JSON.stringify([
        {
          names: { en: "Morning", es: "Morning" },
        },
        {
          names: { en: "Afternoon", es: "Tarde" },
        },
        {
          names: { en: "Night", es: "Noche" },
        },
      ]),
    },
    {
      key: "DAYS_OF_WEEK",
      data: JSON.stringify(daysOfWeek),
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
