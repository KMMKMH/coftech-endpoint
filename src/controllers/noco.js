const Joi = require("joi");

const modelNoco = require("../models/noco");

const getTableColumns = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      tableID: Joi.string().required(),
    });
    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelNoco.getTableColumns(req.query);

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

const insertTableData = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      projectID: Joi.string().required(),
      tableID: Joi.string().required(),
    });
    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.array().items(Joi.object()).required();
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelNoco.insertTableData(req.query, req.body);

    res.status(200).json({
      code: 200,
      status: true,
      data: response[0] ? true : false,
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

const deleteTableData = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      projectID: Joi.string().required(),
      tableID: Joi.string().required(),
    });
    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelNoco.deleteTableData(req.query);

    res.status(200).json({
      code: 200,
      status: true,
      data: {
        message: "Data deleted successfully",
        rows: response.length,
      },
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

const getBaseTables = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      projectID: Joi.string().required(),
    });
    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelNoco.getBaseTables(req.query);

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
  getTableColumns,
  insertTableData,
  deleteTableData,
  getBaseTables,
};
