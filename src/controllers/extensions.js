const repoExtensions = require("../repositories/extensions");
const modelExtensions = require("../models/extensions");
const Joi = require("joi");

const listExtensions = async (req, res) => {
  try {
    const querySchema = Joi.object({
      extensionID: Joi.string().uuid({ version: "uuidv4" }).allow(null, ""),
    });

    const { error, value: queryValues } = querySchema.validate(req.query);

    const { extensionID } = queryValues;

    if (error) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: error.details[0].message,
      });
    }

    const query = {
      ...(extensionID && {
        "extensions.uuid_unique": extensionID,
      }),
    };

    const response = await repoExtensions.getExtensionByField(query);
    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const updateExtension = async (req, res) => {
  try {
    const querySchema = Joi.object({
      extensionID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const bodySchema = Joi.object({
      name: Joi.string().min(10).max(255).optional().allow(null),
      status: Joi.boolean()
        .truthy(1)
        .falsy(0)
        .custom((value) => (value ? 1 : 0))
        .optional(),
      icon: Joi.string().optional().allow(null),
      category_id: Joi.string()
        .uuid({ version: "uuidv4" })
        .optional()
        .allow(null),
      description: Joi.object({
        en: Joi.string().min(10).max(1000).allow(null),
        es: Joi.string().min(10).max(1000).allow(null),
        zh: Joi.string().min(5).max(1000).allow(null),
      })
        .min(1)
        .optional(),
    });

    const { error: queryError, value: queryValues } = querySchema.validate(
      req.query
    );
    const { error: bodyError, value: bodyValues } = bodySchema.validate(
      req.body
    );

    if (queryError || bodyError) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: queryError
          ? queryError.details[0].message
          : bodyError.details[0].message,
      });
    }

    const { extensionID } = queryValues;

    const response = await modelExtensions.updateExtension(
      { extensionID },
      bodyValues
    );
    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const listExtensionCategories = async (req, res) => {
  try {
    const querySchema = Joi.object({
      categoryID: Joi.string().uuid({ version: "uuidv4" }).optional(),
    });

    const { error, value: queryValues } = querySchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: error.details[0].message,
      });
    }

    const { categoryID } = queryValues;

    const query = {
      ...(categoryID && { "extensions_categories.uuid_unique": categoryID }),
    };

    const response = await repoExtensions.getExtensionCategoryByField(query);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const deleteExtensionCategory = async (req, res) => {
  try {
    const querySchema = Joi.object({
      categoryID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error, value: queryValues } = querySchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: error.details[0].message,
      });
    }

    await modelExtensions.deleteExtensionCategory(queryValues);

    res.status(200).json({
      code: 200,
      status: true,
      message: "Extension category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const createExtensionCategory = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      name: Joi.string().required(),
      unique: Joi.boolean()
        .truthy(1)
        .falsy(0)
        .default(false)
        .custom((value) => (value ? 1 : 0))
        .required(),
      dynamic: Joi.boolean()
        .truthy(1)
        .falsy(0)
        .default(false)
        .custom((value) => (value ? 1 : 0))
        .required(),
    });

    const { error, value: bodyValues } = bodySchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: error.details[0].message,
      });
    }

    const { name } = bodyValues;

    const key = name.trim().toUpperCase().replace(/\s+/g, "_");

    const [extensionField] = await repoExtensions.getExtensionCategoryByField({
      "extensions_categories.key": key,
    });

    if (extensionField) {
      return res.status(409).json({
        code: 409,
        status: false,
        message: "Extension category with this key already exists",
      });
    }

    const payload = {
      ...bodyValues,
      key,
    };

    await repoExtensions.saveExtensionCategory(payload);

    const response = await repoExtensions.getExtensionCategoryByField({
      "extensions_categories.key": key,
    });

    res.status(200).json({
      code: 200,
      status: true,
      message: "Extension category created successfully",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const updateExtensionCategory = async (req, res) => {
  try {
    const querySchema = Joi.object({
      categoryID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const bodySchema = Joi.object({
      name: Joi.string().min(10).max(100).optional().allow(null),
      unique: Joi.boolean()
        .truthy(1)
        .falsy(0)
        .default(false)
        .custom((value) => (value ? 1 : 0))
        .optional(),
      dynamic: Joi.boolean()
        .truthy(1)
        .falsy(0)
        .default(false)
        .custom((value) => (value ? 1 : 0))
        .optional(),
    });

    const { error: queryError, value: queryValues } = querySchema.validate(
      req.query
    );
    const { error: bodyError, value: bodyValues } = bodySchema.validate(
      req.body
    );

    if (queryError || bodyError) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: queryError
          ? queryError.details[0].message
          : bodyError.details[0].message,
      });
    }

    const [categoryField] = await repoExtensions.getExtensionCategoryByField({
      "extensions_categories.uuid_unique": queryValues.categoryID,
    });

    if (!categoryField) {
      return res.status(404).json({
        code: 404,
        status: false,
        message: `Extension category with ID ${queryValues.categoryID} not found`,
      });
    }

    await modelExtensions.updateExtensionCategory(bodyValues, queryValues);

    res.status(200).json({
      code: 200,
      status: true,
      message: "Extension category updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const listConfigsTemplates = async (req, res) => {
  try {
    const querySchema = Joi.object({
      configTemplateID: Joi.string()
        .uuid({ version: "uuidv4" })
        .allow(null, ""),
      extensionID: Joi.string().uuid({ version: "uuidv4" }).optional(),
    });

    const { error, value: queryValues } = querySchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: error.details[0].message,
      });
    }

    const { configTemplateID, extensionID } = queryValues;

    const query = {
      ...(configTemplateID && {
        "configs_templates.uuid_unique": configTemplateID,
      }),
      ...(extensionID && {
        "configs_templates.extension_id": extensionID,
      }),
    };

    const response = await repoExtensions.getConfigTemplateByField(query);
    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const updateConfigTemplate = async (req, res) => {
  try {
    const querySchema = Joi.object({
      configTemplateID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const bodySchema = Joi.object({
      name: Joi.string().min(10).max(100).optional().allow(null),
      description: Joi.string().min(10).max(255).optional().allow(null),
    });

    const { error: queryError, value: queryValues } = querySchema.validate(
      req.query
    );
    const { error: bodyError, value: bodyValues } = bodySchema.validate(
      req.body
    );

    if (queryError || bodyError) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: queryError
          ? queryError.details[0].message
          : bodyError.details[0].message,
      });
    }

    const { configTemplateID } = queryValues;

    const response = await modelExtensions.updateConfigTemplate(
      { configTemplateID },
      bodyValues
    );

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getExtensionConfigs = async (req, res) => {
  try {
    const querySchema = Joi.object({
      extensionID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error, value: queryValues } = querySchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: error.details[0].message,
      });
    }

    const { extensionID } = queryValues;

    const response = await repoExtensions.getConfigTemplateByField({
      "configs_templates.extension_id": extensionID,
    });

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

module.exports = {
  listExtensions,
  updateExtension,
  createExtensionCategory,
  updateExtensionCategory,
  listExtensionCategories,
  deleteExtensionCategory,
  listConfigsTemplates,
  updateConfigTemplate,
  getExtensionConfigs,
};
