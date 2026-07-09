const tableName = "configs_templates";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE ${tableName}
    MODIFY COLUMN owner_type ENUM('company', 'extension', 'agenda', 'raffle', 'provider') NULL
  `);

  await knex.raw(`
    ALTER TABLE ${tableName}
    DROP CHECK check_owner_type_extension,
    ADD CONSTRAINT check_owner_type_extension CHECK (
      (
        owner_type IN ('company', 'agenda', 'raffle', 'provider') 
        AND extension_id IS NULL
      )
      OR 
      (
        owner_type = 'extension' 
        AND extension_id IS NOT NULL
      )
    )
  `);

  await knex(tableName).where({ key: "WHATSAPP_PROVIDER" }).del();

  const [provider] = await knex("social_networks_providers")
    .select("uuid_unique")
    .where({ key: "meta" })
    .limit(1);

  if (!provider) {
    throw new Error("Provider with key 'meta' was not found");
  }

  const keysToUpdate = [
    "WHATSAPP_BUSINESS_ID",
    "WHATSAPP_SYSTEM_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_WEBHOOK_SECRET",
  ];

  await knex(tableName).whereIn("key", keysToUpdate).update({
    owner_type: "provider",
    sn_provider_id: provider.uuid_unique,
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const keysToRevert = [
    "WHATSAPP_BUSINESS_ID",
    "WHATSAPP_SYSTEM_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_WEBHOOK_SECRET",
  ];

  await knex(tableName).whereIn("key", keysToRevert).update({
    owner_type: "company",
    sn_provider_id: null,
  });

  await knex.raw(`
    ALTER TABLE ${tableName}
    DROP CHECK check_owner_type_extension,
    ADD CONSTRAINT check_owner_type_extension CHECK (
      (
        owner_type IN ('company', 'agenda', 'raffle') 
        AND extension_id IS NULL
      )
      OR 
      (
        owner_type = 'extension' 
        AND extension_id IS NOT NULL
      )
    )
  `);

  await knex.raw(`
    ALTER TABLE ${tableName}
    MODIFY COLUMN owner_type ENUM('company', 'extension', 'agenda', 'raffle') NULL
  `);
};
