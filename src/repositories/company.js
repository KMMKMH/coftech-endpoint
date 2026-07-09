const db = require("../utils/db");
const logger = require("../utils/logger");

const getCompanyByField = async (data, isRaw = false) => {
  try {
    const query = db("company")
      .select("company.*")
      .count("bots.id as bot_count")
      .leftJoin("bots", "company.uuid_unique", "bots.company_id")
      .groupBy("company.uuid_unique");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting company with data: ${JSON.stringify(
        data
      )}, isRaw: ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting company data`);
  }
};

const saveCompany = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    logger.info(`Saving company with data: ${JSON.stringify(data)}`);

    const [companyId] = await db("company").insert(data);
    const response = companyId
      ? (await getCompanyByField({ "company.id": companyId }))[0]
      : false;

    logger.info(`Save company response: ${JSON.stringify(response)}`);
    return response;
  } catch (e) {
    logger.error(
      `Error saving company - data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving company`);
  }
};

const updateCompany = async (where, data) => {
  try {
    logger.info(
      `Updating company - where: ${JSON.stringify(
        where
      )}, data: ${JSON.stringify(data)}`
    );

    return await db("company").where(where).update(data);
  } catch (e) {
    logger.error(
      `Error updating company - data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating company`);
  }
};

const getCoreConfigsByField = async (data, isRaw = false) => {
  try {
    const query = db("configs");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting configs - data: ${JSON.stringify(
        data
      )}, isRaw: ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting configs data`);
  }
};

const getCompanyConfigByField = async (data, isRaw = false) => {
  try {
    const query = db("company_configs")
      .select(
        "company_configs.*",
        "configs_templates.name as template_name",
        "configs_templates.key as template_key",
        "configs_templates.data_type as template_data_type",
        "configs_templates.data_options as template_data_options",
        "configs_templates.extension_id as template_extension_id",
        "configs_templates.sn_provider_id as template_sn_provider_id",
        "configs_templates.owner_type as template_owner_type",
        "configs_templates.description as template_description",
        "configs_templates.internal as template_internal",
        "extensions_categories.name as extension_category_name",
        "extensions_categories.dynamic as extension_category_dynamic",
        "extensions_categories.unique as extension_category_unique",
        "extensions_categories.uuid_unique as extension_category_uuid_unique"
      )
      .join(
        "configs_templates",
        "company_configs.config_template_id",
        "configs_templates.uuid_unique"
      )
      .leftJoin(
        "extensions",
        "configs_templates.extension_id",
        "extensions.uuid_unique"
      )
      .leftJoin(
        "extensions_categories",
        "extensions.category_id",
        "extensions_categories.uuid_unique"
      );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting company config with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting company config data`);
  }
};

const saveCompanyConfig = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;
    logger.info(`Saving company config with data: ${JSON.stringify(data)}`);

    const [companyId] = await db("company_configs").insert(data);
    const response = companyId
      ? (await getCompanyByField({ "company_configs.id": companyId }))[0]
      : false;

    logger.info(`Save company config response: ${JSON.stringify(response)}`);
    return response;
  } catch (e) {
    logger.error(
      `Error saving company config - data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving company config`);
  }
};

const updateCompanyConfig = async (where, data) => {
  try {
    logger.info(
      `Updating company config - where: ${JSON.stringify(
        where
      )}, data: ${JSON.stringify(data)}`
    );

    return await db("company_configs").where(where).update(data);
  } catch (e) {
    logger.error(
      `Error updating company config - data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating company config`);
  }
};

const deleteCompanyConfig = async (where) => {
  try {
    logger.info(`Deleting company config - where: ${JSON.stringify(where)}`);

    return await db("company_configs").where(where).del();
  } catch (e) {
    logger.error(
      `Error deleting company config - where: ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error deleting company config`);
  }
};

const getConfigsTemplatesByField = async (data, isRaw = false) => {
  try {
    const query = db("configs_templates");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting configs templates with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting configs templates data`);
  }
};

const getCompanyConfigExtensionsByField = async (data, isRaw = false) => {
  try {
    const query = db("company_configs");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting company config extensions with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting company config extensions data`);
  }
};

const getMissingPlansExtensionsConfigs = async (botID = null) => {
  try {
    const params = botID ? [botID] : [];
    const [result] = await db.raw(
      `
      WITH plans_extensions_configs AS (
        SELECT 
          pe.plan_id,
          ct.uuid_unique AS config_template_id,
          ct.data_default,
          ct.extension_id
        FROM plans_extensions pe 
        INNER JOIN configs_templates ct 
          ON pe.extension_id = ct.extension_id
      )
      SELECT
        b.uuid_unique AS bot_id,
        b.name AS bot_name,
        b.company_id,
        cc.uuid_unique AS company_config_uuid,
        pec.data_default AS data_default,
        pec.extension_id,
        pec.config_template_id
      FROM bots b
      LEFT JOIN plans_extensions_configs pec 
        ON b.plan_id = pec.plan_id
      LEFT JOIN company_configs cc 
        ON pec.config_template_id = cc.config_template_id
        AND b.company_id = cc.company_id
        AND b.uuid_unique = cc.bot_id
      WHERE cc.uuid_unique IS NULL
      ${botID ? "AND b.uuid_unique = ?" : ""}
    `,
      params
    );

    return result;
  } catch (e) {
    logger.error(
      `Error getting plans extensions configs with botID: ${botID}, error: ${JSON.stringify(
        e
      )}`
    );
    throw new Error(`Error getting plans extensions configs data`);
  }
};

const updateCompanyConfigStatusExtension = async (configs_ids, data) => {
  try {
    logger.info(
      `Updating company config status extension - configs_ids: ${JSON.stringify(
        configs_ids
      )}, data: ${JSON.stringify(data)}`
    );

    return await db("company_configs")
      .whereIn("uuid_unique", configs_ids)
      .update(data);
  } catch (e) {
    logger.error(
      `Error updating company config status extension - configs_ids: ${JSON.stringify(
        configs_ids
      )}, data: ${JSON.stringify(data)}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating company config status extension`);
  }
};

module.exports = {
  getCompanyByField,
  saveCompany,
  updateCompany,
  getCoreConfigsByField,
  saveCompanyConfig,
  updateCompanyConfig,
  getCompanyConfigByField,
  getConfigsTemplatesByField,
  deleteCompanyConfig,
  getCompanyConfigExtensionsByField,
  getMissingPlansExtensionsConfigs,
  updateCompanyConfigStatusExtension,
};
