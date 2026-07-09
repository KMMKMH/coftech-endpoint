const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "account_role";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.string("uuid_unique").unique().notNullable();
    table.string("account_id").notNullable().unique();
    table.string("role_id").notNullable();

    table.foreign("account_id").references("uuid_unique").inTable("accounts");
    table.foreign("role_id").references("uuid_unique").inTable("roles");
  });

  await knex.raw(up(tableName));
  const accountField1 = await knex("accounts")
    .where("email", "support@coftechservices.com")
    .select("uuid_unique")
    .first();
  const accountField2 = await knex("accounts")
    .where("email", "admin@coftechservices.com")
    .select("uuid_unique")
    .first();
  const roleField = await knex("roles")
    .where("key", "SUPERADMIN")
    .select("uuid_unique")
    .first();

  await knex(tableName).insert([
    {
      account_id: accountField1.uuid_unique,
      role_id: roleField.uuid_unique,
    },
    {
      account_id: accountField2.uuid_unique,
      role_id: roleField.uuid_unique,
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
