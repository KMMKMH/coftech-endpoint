const modelStore = require("../models/store");
const repoStore = require("../repositories/store");
const Joi = require("joi");

const getStoreCategory = async (req, res) => {
  try {
    const querySchema = Joi.object({
      categoryID: Joi.string().allow(null),
      parentID: Joi.string().allow(null),
    }).oxor("categoryID", "parentID");

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelStore.getStoreCategoryList(req.query);
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

const saveStoreCategory = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      name: Joi.string().required(),
      parentID: Joi.string().allow(null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelStore.saveStoreCategory(req.body);
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

const updateStoreCategory = async (req, res) => {
  try {
    const querySchema = Joi.object({
      categoryID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
      parentID: Joi.string().allow(null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelStore.updateStoreCategory(req.query, req.body);

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

const deleteStoreCategory = async (req, res) => {
  try {
    const querySchema = Joi.object({
      categoryID: Joi.string().required(),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelStore.deleteStoreCategory(req.query);
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

const getStoreItems = async (req, res) => {
  try {
    const querySchema = Joi.object({
      itemID: Joi.string().allow(null),
      categoryID: Joi.string().allow(null),
    }).oxor("itemID", "categoryID");

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelStore.getStoreItemsList(req.query);

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

const saveStoreItem = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      amount: Joi.number().precision(2).positive().required(),
      currencyID: Joi.string().required(),
      categoryID: Joi.string().required(),
      typeID: Joi.string().required(),
      is_periodic: Joi.boolean().optional(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const imagesSchema = Joi.array().items(
      Joi.object({
        fieldname: Joi.string().required(),
        originalname: Joi.string().required(),
        encoding: Joi.string().required(),
        mimetype: Joi.string().required(),
        buffer: Joi.binary().required(),
        size: Joi.number().required(),
      })
    );

    const { error: imagesError } = imagesSchema.validate(req.files);
    if (imagesError) {
      throw new Error(imagesError.details[0].message);
    }

    const response = await modelStore.saveStoreItem(req.body, req.files);

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

const updateStoreItem = async (req, res) => {
  try {
    const querySchema = Joi.object({
      itemID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      amount: Joi.number().precision(2).positive().required(),
      currencyID: Joi.string().required(),
      categoryID: Joi.string().required(),
      typeID: Joi.string().required(),
      is_periodic: Joi.boolean().optional(),
      images: Joi.string().optional().allow(null, ""),
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    if (req.files.length > 0) {
      const imagesSchema = Joi.array().items(
        Joi.object({
          fieldname: Joi.string().required(),
          originalname: Joi.string().required(),
          encoding: Joi.string().required(),
          mimetype: Joi.string().required(),
          buffer: Joi.binary().required(),
          size: Joi.number().required(),
        })
          .optional()
          .allow(null)
      );

      const { error: imagesError } = imagesSchema.validate(req.files);
      if (imagesError) {
        throw new Error(imagesError.details[0].message);
      }
    }

    const data = {
      ...req.body,
      images: req.files,
    };

    const response = await modelStore.updateStoreItem(req.query, data);

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

const deleteStoreItem = async (req, res) => {
  try {
    const querySchema = Joi.object({
      itemID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelStore.deleteStoreItem(req.query);

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

const generateUrlItem = async (req, res) => {
  try {
    const querySchema = Joi.object({
      itemID: Joi.string().required(),
      botID: Joi.string().optional().allow(null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const query = {
      ...req.query,
      user: req.unique_token.user,
    };

    const response = await modelStore.generateUrlItem(query);

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

const getStoreTypes = async (req, res) => {
  try {
    const response = await repoStore.getStoreTypeByField({});

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

const getStoreLogs = async (req, res) => {
  try {
    const querySchema = Joi.object({
      itemID: Joi.string().optional().allow(null),
      companyID: Joi.string().optional().allow(null),
      botID: Joi.string().optional().allow(null),
    })
      .or("itemID", "companyID", "botID")
      .custom((value, helpers) => {
        if (Object.values(value).every((v) => v === null)) {
          return helpers.error("object.atLeastOneRequired");
        }
        return value;
      });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = modelStore.getStoreLogsList(req.query);

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

const saveStoreLog = async (req, res) => {
  try {
    const querySchema = Joi.object({
      itemID: Joi.string().required(),
      companyID: Joi.string().optional().allow(null),
      botID: Joi.string().optional().allow(null),
    }).oxor("companyID", "botID");

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      purchase_date: Joi.date().required(),
      activation_date: Joi.date().allow(null),
      renewal_date: Joi.date().allow(null),
      status: Joi.boolean().required(),
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelStore.saveStoreLog(req.query, req.body);

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

const updateStoreLog = async (req, res) => {
  try {
    const querySchema = Joi.object({
      logID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      purchase_date: Joi.date().required(),
      activation_date: Joi.date().allow(null),
      renewal_date: Joi.date().allow(null),
      status: Joi.boolean().required(),
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelStore.updateStoreLog(req.query, req.body);

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

const deleteStoreLog = async (req, res) => {
  try {
    const querySchema = Joi.object({
      logID: Joi.string().required(),
    });
    
    const { error: queryError } = querySchema.validate(req.query);
    if(queryError){
      throw new Error(queryError.details[0].message);
    }

    const response = await modelStore.deleteStoreLog(req.query);

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
}

module.exports = {
  getStoreCategory,
  saveStoreCategory,
  updateStoreCategory,
  deleteStoreCategory,
  getStoreItems,
  saveStoreItem,
  updateStoreItem,
  deleteStoreItem,
  generateUrlItem,
  getStoreTypes,
  getStoreLogs,
  saveStoreLog,
  updateStoreLog,
  deleteStoreLog,
};
