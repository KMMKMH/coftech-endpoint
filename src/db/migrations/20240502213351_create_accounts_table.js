const { hashPassword } = require("../../models/accounts");
const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "accounts";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.bigInteger("id").notNullable();
    table.string("uuid_unique").unique().notNullable();
    table.string("username").notNullable();
    table.string("email").notNullable().unique();
    table.string("registered_at").notNullable();
    table.string("first_name").notNullable();
    table.string("last_name").notNullable();
    table.string("phone").notNullable();
    table.string("whatsapp").notNullable();
    table.string("password").notNullable();
    table.boolean("status").notNullable().defaultTo(true);
    table.string("company_id").notNullable();
    table.string("language").notNullable().defaultTo("en");
    table.longtext("photo");
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
  });

  await knex.raw(up(tableName));
  const companyField = await knex("company")
    .where("name", "Coftech Inc.")
    .select("uuid_unique")
    .first();
  await knex(tableName).insert([
    {
      id: Date.now(),
      username: "coftech",
      email: "support@coftechservices.com",
      registered_at: "2024-06-21 01:59:28",
      first_name: "John",
      last_name: "Doe",
      phone: "",
      whatsapp: "",
      password: await hashPassword("coftech2024"),
      status: true,
      company_id: companyField.uuid_unique,
    },
    {
      id: Date.now(),
      username: "coftech1",
      email: "admin@coftechservices.com",
      registered_at: "2024-06-21 01:59:28",
      first_name: "John",
      last_name: "Doe",
      phone: "",
      whatsapp: "",
      password: await hashPassword("coftech2024"),
      status: true,
      company_id: companyField.uuid_unique,
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
