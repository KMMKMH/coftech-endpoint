const templateTable = "configs_templates";
const companyConfigTable = "company_configs";
const EXTENSION_KEY = "SCREENSHOT_DATA";
const MAX_PROMPT_LENGTH = 1024;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const [templateField] = await knex(templateTable)
    .select("uuid_unique", "data_default")
    .where({ key: EXTENSION_KEY });

  if (!templateField) {
    console.warn(`[SKIP] Template ${EXTENSION_KEY} no encontrado.`);
    return;
  }

  const updatedTemplateData = JSON.stringify(
    (JSON.parse(templateField.data_default) || []).map((item) => ({
      ...item,
      restrictions: {
        ...(item.restrictions || {}),
        prompt: { maxLength: MAX_PROMPT_LENGTH },
      },
    }))
  );

  await knex(templateTable)
    .where({ uuid_unique: templateField.uuid_unique })
    .update({ data_default: updatedTemplateData });

  const companyConfigs = await knex(companyConfigTable)
    .select("uuid_unique", "data")
    .where({ config_template_id: templateField.uuid_unique });

  for (const config of companyConfigs) {
    const updatedCompanyData = JSON.stringify(
      (JSON.parse(config.data) || []).map((item) => ({
        ...item,
        restrictions: {
          ...(item.restrictions || {}),
          prompt: { maxLength: MAX_PROMPT_LENGTH },
        },
      }))
    );

    await knex(companyConfigTable)
      .where({ uuid_unique: config.uuid_unique })
      .update({ data: updatedCompanyData });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const [template] = await knex("configs_templates")
    .select("uuid_unique", "data_default")
    .where({ key: EXTENSION_KEY });

  if (!template) return;

  const cleanedTemplateData = JSON.stringify(
    (JSON.parse(template.data_default) || []).map((item) => {
      const { restrictions, ...rest } = item; // eslint-disable-line no-unused-vars
      return rest;
    })
  );

  await knex("configs_templates")
    .where({ uuid_unique: template.uuid_unique })
    .update({ data_default: cleanedTemplateData });

  const companyConfigs = await knex("company_configs")
    .select("uuid_unique", "data")
    .where({ config_template_id: template.uuid_unique });

  for (const config of companyConfigs) {
    const cleanedData = JSON.stringify(
      (JSON.parse(config.data) || []).map((item) => {
        const { restrictions, ...rest } = item; // eslint-disable-line no-unused-vars
        return rest;
      })
    );

    await knex("company_configs")
      .where({ uuid_unique: config.uuid_unique })
      .update({ data: cleanedData });
  }
};
