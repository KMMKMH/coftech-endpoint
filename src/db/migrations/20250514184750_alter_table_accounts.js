const tableName = "accounts";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.string("phone").nullable().alter();
  });

  await knex.transaction(async (trx) => {
    const duplicatePhones = await trx(tableName)
      .select(trx.raw("MIN(id) as keep_id"), "phone")
      .whereNotNull("phone")
      .orWhere("phone", "")
      .groupBy("phone")
      .having(trx.raw("COUNT(*)"), ">", 1);

    for (const { keep_id, phone } of duplicatePhones) {
      await trx(tableName)
        .where(function () {
          this.where("phone", phone).orWhere(function () {
            this.whereNull("phone").where("phone", "");
          });
        })
        .andWhere("id", "!=", keep_id)
        .update({ phone: null });
    }
  });

  await knex.schema.alterTable(tableName, (table) => {
    table.string("phone").unique().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.string("phone").notNullable().alter();
    table.dropUnique("phone");
  });
};

exports.config = { transaction: false };
