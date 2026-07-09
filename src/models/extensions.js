const logger = require("../utils/logger");
const repoExtensions = require("../repositories/extensions");
const { isEqual, merge } = require("lodash");

const updateExtension = async (where, data) => {
  try {
    const { extensionID } = where;

    const query = {
      "extensions.uuid_unique": extensionID,
    };

    const [dataExtension] = await repoExtensions.getExtensionByField(query);

    if (!dataExtension) {
      throw new Error(`Extension with ID ${extensionID} not found`);
    }

    const fieldsToUpdate = [
      "name",
      "description",
      "status",
      "icon",
      "category_id",
    ];

    const dataUpdate = fieldsToUpdate.reduce((acc, field) => {
      const newValue = data[field];
      const currentValue = dataExtension[field];

      if (newValue === undefined) return acc;

      if (field === "description") {
        let currentParsed = {};
        if (currentValue && typeof currentValue === "string") {
          try {
            currentParsed = JSON.parse(currentValue);
          } catch {
            logger.error(
              `Failed to parse current description: ${currentValue}`
            );
          }
        }

        if (typeof newValue === "object") {
          const merged = merge({}, currentParsed, newValue);
          acc[field] = JSON.stringify(merged);
        } else {
          acc[field] = newValue;
        }
      } else if (!isEqual(newValue, currentValue)) {
        acc[field] = newValue;
      }

      return acc;
    }, {});

    if (Object.keys(dataUpdate).length > 0) {
      return await repoExtensions.updateExtension(query, dataUpdate);
    }

    return true;
  } catch (error) {
    logger.error(
      `Error updating extension with where: ${JSON.stringify(
        where
      )}, data: ${JSON.stringify(data)}`
    );
    throw error;
  }
};

const deleteExtensionCategory = async (where) => {
  try {
    const { categoryID } = where;

    const queryDeleteCategory = {
      "extensions_categories.uuid_unique": categoryID,
    };

    const [categoryField] = await repoExtensions.getExtensionCategoryByField(
      queryDeleteCategory
    );

    if (!categoryField) {
      throw new Error(`Extension category with ID ${categoryID} not found`);
    }

    const extensionsInCategory = await repoExtensions.getExtensionByField({
      "extensions.category_id": categoryID,
    });

    if (extensionsInCategory.length > 0) {
      const [defaultCategory] =
        await repoExtensions.getExtensionCategoryByField({
          "extensions_categories.key": "DEFAULT",
        });

      if (!defaultCategory) {
        throw new Error(`Default extension category not found`);
      }

      for (const extension of extensionsInCategory) {
        await repoExtensions.updateExtension(
          { "extensions.uuid_unique": extension.uuid_unique },
          { category_id: defaultCategory.uuid_unique }
        );
      }
    }

    return await repoExtensions.deleteExtensionCategory(queryDeleteCategory);
  } catch (error) {
    logger.error(
      `Error deleting extension category with where: ${JSON.stringify(where)}`
    );
    throw error;
  }
};

const updateExtensionCategory = async (data, where) => {
  try {
    const { categoryID } = where;

    const query = {
      "extensions_categories.uuid_unique": categoryID,
    };

    const [categoryField] = await repoExtensions.getExtensionCategoryByField(
      query
    );

    const fieldsToUpdate = ["name", "unique", "dynamic"];
    const dataUpdate = fieldsToUpdate.reduce((acc, field) => {
      const newValue = data[field];
      const currentValue = categoryField[field];

      if (newValue === undefined || newValue === null) return acc;
      if (!isEqual(newValue, currentValue)) {
        acc[field] = newValue;
      }
      return acc;
    }, {});

    if (Object.keys(dataUpdate).length === 0) {
      return true;
    }

    return await repoExtensions.updateExtensionCategory(query, dataUpdate);
  } catch (error) {
    logger.error(
      `Error updating extension category with where: ${JSON.stringify(
        where
      )}, data: ${JSON.stringify(data)}`
    );
    throw error;
  }
};

const updateConfigTemplate = async (where, data) => {
  try {
    const { configTemplateID } = where;

    const query = {
      "configs_templates.uuid_unique": configTemplateID,
    };

    const [dataConfigTemplate] = await repoExtensions.getConfigTemplateByField(
      query
    );

    if (!dataConfigTemplate) {
      throw new Error(`Config template with ID ${configTemplateID} not found`);
    }

    const fieldsToUpdate = ["description", "name"];

    const dataUpdate = fieldsToUpdate.reduce((acc, field) => {
      const newValue = data[field];
      const currentValue = dataConfigTemplate[field];

      if (newValue === undefined) return acc;

      if (!isEqual(newValue, currentValue)) {
        acc[field] = newValue;
      }

      return acc;
    }, {});

    if (Object.keys(dataUpdate).length > 0) {
      return await repoExtensions.updateConfigTemplate(query, dataUpdate);
    }

    return true;
  } catch (error) {
    logger.error(
      `Error updating config template with where: ${JSON.stringify(
        where
      )}, data: ${JSON.stringify(data)}`
    );
    throw error;
  }
};

module.exports = {
  updateExtension,
  deleteExtensionCategory,
  updateExtensionCategory,
  updateConfigTemplate,
};
