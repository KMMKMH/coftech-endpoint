const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "agenda_reserves_accounts";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("agenda_reserve_id").notNullable();
    table.string("account_id").notNullable();
    table.timestamps(true, true);

    table.foreign("agenda_reserve_id").references("uuid_unique").inTable("agenda_reserves").onDelete("CASCADE");
    table.foreign("account_id").references("uuid_unique").inTable("accounts").onDelete("CASCADE");
  });

  await knex.raw(up(tableName));

  const reserves = await knex("agenda_reserves");

  for (const reserve of reserves) {
    for (const account of JSON.parse(reserve.participants)) {
      await knex(tableName).insert({
        agenda_reserve_id: reserve.uuid_unique,
        account_id: account,
      });
    }
  }

  await knex.schema.table("agenda_reserves", (table) => {
    table.dropColumn("participants");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.table("agenda_reserves", (table) => {
    table.json("participants").notNullable();
  });

  const reserves = await knex("agenda_reserves");

  for (const reserve of reserves) {
    const accounts = await knex(tableName).where("agenda_reserve_id", reserve.uuid_unique);
    await knex("agenda_reserves").where("uuid_unique", reserve.uuid_unique).update({
      participants: JSON.stringify(
        JSON.stringify(accounts.map((account) => account.account_id))
      ),
    });
  }

  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
