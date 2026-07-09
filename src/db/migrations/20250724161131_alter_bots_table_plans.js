/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("bots", (table) => {
    table.string("plan_id");
  });

  const basicPlanId = await knex("plans")
    .select("uuid_unique")
    .where("name", "Basic")
    .first();

  await knex("bots").update({ plan_id: basicPlanId.uuid_unique });

  await knex.schema.alterTable("bots", (table) => {
    table.string("plan_id").notNullable().alter();
    table.foreign("plan_id").references("uuid_unique").inTable("plans");
    table.dropColumn("plan");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("bots", (table) => {
    table.string("plan");
  });

  await knex("bots").update({ plan: "BASIC" });

  await knex.schema.alterTable("bots", (table) => {
    table.dropForeign("plan_id");
    table.dropColumn("plan_id");
    table.string("plan").notNullable().alter();
  });
};
