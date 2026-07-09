const extensionsToInsert = [
  "OPEN_AI_SERVICE",
  "BRAIN",
  "GEMINI",
  "PINECONE",
  "SCREENSHOT",
  "YAPPY",
  "GOOGLE_CALENDAR",
];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const currencyId = await knex("currencies")
    .select("uuid_unique")
    .where("code", "USD")
    .first();

  if (!currencyId) {
    throw new Error("Currency with code 'USD' not found");
  }

  await knex("plans").insert({
    name: "Basic",
    currency_id: currencyId.uuid_unique,
  });

  const plansId = await knex("plans")
    .select("uuid_unique")
    .where("name", "Basic")
    .first();

  const extensionsIds = await knex("extensions")
    .select("uuid_unique")
    .whereIn("key", extensionsToInsert);

  await knex("plans_extensions").insert(
    extensionsIds.map((extension) => ({
      plan_id: plansId.uuid_unique,
      extension_id: extension.uuid_unique,
    }))
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const planQuery = knex("plans").select("uuid_unique").where("name", "Basic");

  if (await planQuery.first()) {
    await planQuery.del();
  }
};
