const Joi = require("joi");
const modelActionLogs = require("../models/dashboardLogs");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const getActionLogs = async (req, res) => {
  const querySchema = Joi.object({
    companyID: Joi.string().required().messages({
      "any.required": "Field is required",
    }),
    botID: Joi.string().optional(),
    action_type: Joi.string().optional(),
    resource_type: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).default(10),
    orderBy: Joi.string().default("created_at"),
    orderDirection: Joi.string().valid("asc", "desc").default("desc"),
  });

  const query = validateOrThrow(querySchema, req.query);

  const response = await modelActionLogs.getActionLogs(query);

  res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

module.exports = {
  getActionLogs,
};
