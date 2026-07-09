const Joi = require("joi");

const repoCompany = require("../repositories/company");
const modelDesk = require("../models/desk");
const repoDesk = require("../repositories/desk");

const createBase = async (req, res) => {
  const { companyID } = req.query;

  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with id ${companyID} not found`);
    }

    const [baseField] = await repoDesk.getBaseByField({
      "desk_bases.company_id": companyID,
    });

    if (baseField) {
      throw new Error(`Base for company_id ${companyID} already exists.`);
    }

    const response = await modelDesk.saveBase(req.body, req.query);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const updateBase = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      baseID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelDesk.updateBase(req.query, req.body);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getBaseList = async (req, res) => {
  try {
    const { companyID, baseID } = req.query;

    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      baseID: Joi.string().allow("", null),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company: ${companyID} not found.`);
    }

    if (baseID) {
      const [baseField] = await repoDesk.getBaseByField({
        "desk_bases.uuid_unique": baseID,
      });

      if (!baseField) {
        throw new Error(`Base: ${baseID} not found.`);
      }
    }

    const findParams = {
      ...{ "desk_bases.company_id": companyID },
      ...(baseID && { "desk_bases.uuid_unique": baseID }),
    };

    const response = await repoDesk.getBaseByField(findParams);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response.length > 0 ? response : [],
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const deleteBase = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      baseID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelDesk.deleteBase(req.query);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const createTable = async (req, res) => {
  const { baseID } = req.query;

  try {
    const paramsSchema = Joi.object({
      baseID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      table_name: Joi.string().required().description("Name of a table"),
      columns: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required().description("Name of the column"),
            type: Joi.string()
              .valid("string", "int", "float", "longtext")
              .required()
              .description("Data type of the column"),
          })
        )
        .required()
        .description("List of columns with name and type"),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const [baseField] = await repoDesk.getBaseByField({
      "desk_bases.uuid_unique": baseID,
    });

    if (!baseField) {
      throw new Error(`base not found`);
    }

    const response = await modelDesk.createTable(req.body, req.query);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const deleteTable = async (req, res) => {
  const { baseID, tableID } = req.query;

  try {
    const paramsSchema = Joi.object({
      baseID: Joi.string().required(),
      tableID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
      "desk_tables.base_id": baseID,
    });

    if (!tableField) {
      throw new Error(`Table with data ${JSON.stringify(req.query)} not exist`);
    }

    const response = await modelDesk.deleteTable(req.query);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const updateTable = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      tableID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      table_name: Joi.string(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelDesk.updateTable(req.query, req.body);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getTableList = async (req, res) => {
  try {
    const { baseID, tableID } = req.query;

    const paramsSchema = Joi.object({
      baseID: Joi.string().required(),
      tableID: Joi.string().allow("", null),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const [baseField] = await repoDesk.getBaseByField({
      "desk_bases.uuid_unique": baseID,
    });

    if (!baseField) {
      throw new Error(`Base: ${baseID} not found.`);
    }

    if (tableID) {
      const [tableField] = await repoDesk.getTableByField({
        "desk_tables.uuid_unique": tableID,
      });

      if (!tableField) {
        throw new Error(`Table: ${tableID} not found.`);
      }
    }

    const findParams = {
      ...{ "desk_tables.base_id": baseID },
      ...(tableID && { "desk_tables.uuid_unique": tableID }),
    };

    const response = await repoDesk.getTableByField(findParams);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response.length > 0 ? response : [],
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const insertData = async (req, res) => {
  const { tableID } = req.query;
  const body = req.body;

  try {
    const paramsSchema = Joi.object({
      tableID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.array().items(
      Joi.object({
        columnID: Joi.string().required(),
        data: Joi.any().required(),
      })
    );

    const { error: bodyError } = bodySchema.validate(body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const insertDataBody = body.map(({ columnID, data }) => ({
      columnID,
      data,
    }));

    const response = await modelDesk.insertData({
      tableID,
      columnData: insertDataBody,
    });

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getData = async (req, res) => {
  try {
    const { tableID } = req.query;

    const paramsSchema = Joi.object({
      tableID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    if (!tableField) {
      throw new Error(`Table: ${tableID} not found.`);
    }

    const response = await repoDesk.getDataTableByField(
      tableField.customer_table_name
    );

    return res.status(200).json({
      code: 200,
      status: true,
      data: response.length > 0 ? response : [],
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const updateData = async (req, res) => {
  const { tableID } = req.query;
  const { columnID, rowID } = req.body;

  try {
    const paramsSchema = Joi.object({
      tableID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.alternatives().try(
      Joi.object(),
      Joi.array().items(Joi.object())
    );

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    if (!tableField) {
      throw new Error(`table with id ${tableID} not found`);
    }

    const [columnsField] = await repoDesk.getColumnsByField({
      "desk_columns.uuid_unique": columnID,
      "desk_columns.table_id": tableID,
    });

    if (!columnsField) {
      throw new Error(`column with id ${columnID} not exist`);
    }

    const where = {
      [`${tableField.customer_table_name}.uuid_unique`]: rowID,
    };

    const [rowField] = await repoDesk.getDataTableByField(
      tableField.customer_table_name,
      where
    );

    if (!rowField) {
      throw new Error(`row with id ${rowID} not exist`);
    }

    const response = await modelDesk.updateData(tableID, columnID, req.body);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const deleteData = async (req, res) => {
  const { tableID } = req.query;

  const { rowID } = req.body;

  try {
    const paramsSchema = Joi.object({
      tableID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.alternatives().try(
      Joi.object(),
      Joi.array().items(Joi.object())
    );

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    if (!tableField) {
      throw new Error(`table with id ${tableID} not found`);
    }

    const where = {
      [`${tableField.customer_table_name}.uuid_unique`]: rowID,
    };

    const [rowField] = await repoDesk.getDataTableByField(
      tableField.customer_table_name,
      where
    );

    if (!rowField) {
      throw new Error(`row with id ${rowID} not exist`);
    }

    const response = await modelDesk.deleteData(
      tableField.customer_table_name,
      rowID
    );

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const createColumn = async (req, res) => {
  const { tableID } = req.query;

  try {
    const paramsSchema = Joi.object({
      tableID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
      type: Joi.string().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    if (!tableField) {
      throw new Error(`table with id ${tableID} not found`);
    }

    const response = await modelDesk.createColumn(req.body, req.query);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const deleteColumn = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      tableID: Joi.string().required(),
      columnID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { columnID, tableID } = req.query;

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    if (!tableField) {
      throw new Error(`table with id ${tableID} not found`);
    }

    const [columnField] = await repoDesk.getColumnsByField({
      "desk_columns.uuid_unique": columnID,
    });

    if (!columnField) {
      throw new Error(`column with id ${columnID} not found`);
    }

    const response = await modelDesk.deleteColumn(req.query);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const updateColumn = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      tableID: Joi.string().required(),
      columnID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      column_name: Joi.string().allow("", null),
      column_type: Joi.string().allow("", null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { columnID, tableID } = req.query;

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    if (!tableField) {
      throw new Error(`table with id ${tableID} not found`);
    }

    const [columnField] = await repoDesk.getColumnsByField({
      "desk_columns.uuid_unique": columnID,
    });

    if (!columnField) {
      throw new Error(`column with id ${columnID} not found`);
    }

    const response = await modelDesk.updateColumn(req.body, req.query);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getColumnList = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      tableID: Joi.string().required(),
      columnID: Joi.string().allow("", null),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { columnID, tableID } = req.query;

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    if (!tableField) {
      throw new Error(`table with id: ${tableID} not found.`);
    }

    if (columnID) {
      const [columnField] = await repoDesk.getColumnsByField({
        "desk_columns.uuid_unique": columnID,
      });

      if (!columnField) {
        throw new Error(`column with id: ${columnID} not found.`);
      }
    }

    const findParams = {
      ...{ "desk_columns.table_id": tableID },
      ...(columnID && { "desk_columns.uuid_unique": columnID }),
    };

    const response = await repoDesk.getColumnsByField(findParams);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response.length > 0 ? response : [],
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

module.exports = {
  createBase,
  updateBase,
  getBaseList,
  deleteBase,
  createTable,
  deleteTable,
  updateTable,
  getTableList,
  insertData,
  getData,
  updateData,
  deleteData,
  createColumn,
  deleteColumn,
  updateColumn,
  getColumnList,
};
