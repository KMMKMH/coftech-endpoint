const db = require("../utils/db");
const logger = require("../utils/logger");

const getExtensionByField = async (data) => {
  try {
    const query = db("extensions")
      .select(
        "extensions.uuid_unique",
        "extensions.name",
        "extensions.key",
        "extensions.status",
        "extensions.icon",
        "extensions.description",
        "extensions.category_id",
        db.raw(`
          JSON_OBJECT(
            'uuid_unique', extensions_categories.uuid_unique,
            'name', extensions_categories.name,
            'unique', extensions_categories.unique,
            'dynamic', extensions_categories.dynamic
          ) as category
        `),
        db.raw(
          `CASE 
          WHEN COUNT(extensions_images.id) = 0 THEN NULL 
          ELSE JSON_OBJECT(
            "url", MAX(extensions_images.url),
            "identificator", MAX(extensions_images.identificator),
            "alter_text", MAX(extensions_images.alter_text),
            "is_cover", MAX(extensions_images.is_cover),
            "id", MAX(extensions_images.uuid_unique)
          ) 
          END AS extension_image`
        )
      )
      .leftJoin(
        "extensions_categories",
        "extensions.category_id",
        "extensions_categories.uuid_unique"
      )
      .leftJoin("extensions_images", function () {
        this.on(
          "extensions.uuid_unique",
          "=",
          "extensions_images.extension_id"
        ).andOn("extensions_images.is_cover", "=", db.raw("true"));
      })
      .groupBy(
        "extensions.uuid_unique",
        "extensions.name",
        "extensions.key",
        "extensions.status",
        "extensions.icon",
        "extensions.description",
        "extensions.category_id",
        "extensions_categories.uuid_unique",
        "extensions_categories.name",
        "extensions_categories.unique",
        "extensions_categories.dynamic"
      );

    if (data) {
      Object.keys(data).forEach((key) => {
        if (Array.isArray(data[key])) {
          query.whereIn(key, data[key]);
        } else {
          query.where(data);
        }
      });
    }
    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch((error) => {
        console.log(error);
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting extensions with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting extensions`);
  }
};

const updateExtension = async (where, data) => {
  try {
    return await db("extensions").where(where).update(data);
  } catch (error) {
    logger.error(`Error updating extension: ${error}`);
    throw new Error(`Error updating extension: ${error}`);
  }
};

const getExtensionCategoryByField = async (where, isRaw = false) => {
  try {
    const query = db("extensions_categories");

    if (isRaw) {
      query.whereRaw(where);
    } else {
      query.where(where);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(error);
    throw new Error(`Error getting extension category: ${error}`);
  }
};

const updateExtensionCategory = async (where, data) => {
  try {
    return await db("extensions_categories").where(where).update(data);
  } catch (error) {
    logger.error(`Error updating extension category: ${error}`);
    throw new Error(`Error updating extension category: ${error}`);
  }
};

const deleteExtensionCategory = async (where) => {
  try {
    return await db("extensions_categories").where(where).del();
  } catch (error) {
    logger.error(`Error deleting extension category: ${error}`);
    throw new Error(`Error deleting extension category: ${error}`);
  }
};

const saveExtensionCategory = async (data) => {
  try {
    return await db("extensions_categories").insert(data);
  } catch (error) {
    logger.error(`Error creating extension category: ${error}`);
    throw new Error(`Error creating extension category: ${error}`);
  }
};

const updateConfigTemplate = async (where, data) => {
  try {
    return await db("configs_templates").where(where).update(data);
  } catch (error) {
    logger.error(`Error updating config template: ${error}`);
    throw new Error(`Error updating config template: ${error}`);
  }
};

const getConfigTemplateByField = async (where, isRaw = false) => {
  try {
    const query = db("configs_templates");

    if (isRaw) {
      query.whereRaw(where);
    } else {
      query.where(where);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(error);
    throw new Error(`Error getting config template by field: ${error}`);
  }
};

module.exports = {
  getExtensionByField,
  updateExtension,
  getExtensionCategoryByField,
  updateExtensionCategory,
  deleteExtensionCategory,
  saveExtensionCategory,
  updateConfigTemplate,
  getConfigTemplateByField,
};
