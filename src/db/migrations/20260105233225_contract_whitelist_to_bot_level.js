const tableName = "configs_templates";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const toDeleteTemplate = await knex(tableName)
    .select("uuid_unique")
    .where({
      key: "RESPOND_ONLY_WHITELIST",
      owner_type: "company",
    })
    .first();

  if (!toDeleteTemplate) {
    return;
  }

  await knex("company_configs")
    .where({
      config_template_id: toDeleteTemplate.uuid_unique,
    })
    .del();

  await knex(tableName)
    .where({
      key: "RESPOND_ONLY_WHITELIST",
      owner_type: "company",
    })
    .del();

  const toDeleteTemplateNonWhitelist = await knex(tableName)
    .select("uuid_unique")
    .where({
      key: "NON_WHITELIST_MESSAGE",
      owner_type: "company",
    })
    .first();

  if (!toDeleteTemplateNonWhitelist) {
    return;
  }

  await knex("company_configs")
    .where({
      config_template_id: toDeleteTemplateNonWhitelist.uuid_unique,
    })
    .del();

  await knex(tableName)
    .where({
      key: "NON_WHITELIST_MESSAGE",
      owner_type: "company",
    })
    .del();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const oldTemplateWhiteList = {
    key: "RESPOND_ONLY_WHITELIST",
    description: "ALLOW RESPONSES ONLY TO WHITELISTED USERS",
    owner_type: "company",
    data_default: "false",
    data_type: "boolean",
    data_options: null,
    name: "Respond Only Whitelist",
  };
  await knex(tableName).insert(oldTemplateWhiteList);

  const insertedTemplateWhitelist = await knex(tableName)
    .select("uuid_unique")
    .where(oldTemplateWhiteList)
    .first();

  if (!insertedTemplateWhitelist) {
    throw new Error(
      "Failed to insert old RESPOND_ONLY_WHITELIST config template for company owner_type"
    );
  }

  const newTemplateWhitelist = await knex(tableName)
    .select("uuid_unique")
    .where({
      key: "RESPOND_ONLY_WHITELIST",
      owner_type: "bot",
    })
    .first();

  if (!newTemplateWhitelist) {
    return;
  }

  const companyConfigsToMigrate = await knex("company_configs")
    .where({
      config_template_id: newTemplateWhitelist.uuid_unique,
    })
    .distinct("company_id");

  const companyConfigsToAdd = companyConfigsToMigrate.map((config) => ({
    config_template_id: insertedTemplateWhitelist.uuid_unique,
    company_id: config.company_id,
    data: oldTemplateWhiteList.data_default,
  }));

  if (companyConfigsToAdd.length > 0) {
    await knex("company_configs").insert(companyConfigsToAdd);
  }

  await knex("company_configs")
    .where({
      config_template_id: newTemplateWhitelist.uuid_unique,
    })
    .del();

  await knex(tableName)
    .where({
      key: "RESPOND_ONLY_WHITELIST",
      owner_type: "bot",
    })
    .del();

  const newTemplateNonWhitelist = {
    key: "NON_WHITELIST_MESSAGE",
    data_default: "You are not authorized to receive a response.",
    description: "MESSAGE SHOWN TO NON-WHITELISTED USERS",
    data_type: "string",
    owner_type: "company",
    name: "Non-Whitelist Message",
    data_options: null,
  };

  await knex(tableName).insert(newTemplateNonWhitelist);

  const insertedTemplateNonWhitelist = await knex(tableName)
    .select("uuid_unique")
    .where(newTemplateNonWhitelist)
    .first();

  if (!insertedTemplateNonWhitelist) {
    throw new Error(
      "Failed to insert old NON_WHITELIST_MESSAGE config template for company owner_type"
    );
  }

  const companiesToConfigure = await knex("company").select("uuid_unique");
  const companiesToAdd = companiesToConfigure.map((c) => ({
    config_template_id: insertedTemplateNonWhitelist.uuid_unique,
    company_id: c.uuid_unique,
    data: newTemplateNonWhitelist.data_default,
  }));

  if (companiesToAdd.length > 0) {
    await knex("company_configs").insert(companiesToAdd);
  }
};
