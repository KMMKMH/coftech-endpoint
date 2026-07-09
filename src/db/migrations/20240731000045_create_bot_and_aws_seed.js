/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const company = await knex("company").select("uuid_unique").first();
  await knex("bots").insert([
    {
      company_id: company.uuid_unique,
      name: "coftech_test",
      plan: "BASIC",
      status: true,
    },
  ]);

  const bot = await knex("bots")
    .where({ company_id: company.uuid_unique, name: "coftech_test" })
    .first();

  await knex("aws_instances").insert([
    {
      name: "aws_instance_prueba",
      ip: "111.111.111.111",
    },
  ]);

  const aws_instance = await knex("aws_instances")
    .where({ name: "aws_instance_prueba" })
    .first();

  await knex("aws_instances_bots").insert([{
    instance_id : aws_instance.uuid_unique,
    bot_id : bot.uuid_unique
  }]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function () {};
