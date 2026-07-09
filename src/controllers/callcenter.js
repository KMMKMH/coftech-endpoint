const Joi = require("joi");
const modelCallCenter = require("../models/callcenter");

const getCallCenterCategory = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      callCategoryID: Joi.string()
        .uuid({ version: "uuidv4" })
        .optional()
        .allow(null),
      callParentID: Joi.string()
        .uuid({ version: "uuidv4" })
        .optional()
        .allow(null),
    }).oxor("callCategoryID", "callParentID");

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCallCenter.getCallCenterCategoryList(req.query);

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

const saveCallCenterCategory = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
      keywords: Joi.string().allow(null),
      callParentID: Joi.string().uuid({ version: "uuidv4" }).allow(null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCallCenter.saveCallCenterCategory(
      req.query,
      req.body
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

const updateCallCenterCategory = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      callCategoryID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
      keywords: Joi.string().allow(null),
      callParentID: Joi.string().uuid({ version: "uuidv4" }).allow(null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCallCenter.updateCallCenterCategory(
      req.query,
      req.body
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

const deleteCallCenterCategory = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      callCategoryID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCallCenter.deleteCallCenterCategory(req.query);

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

const getCallCenterDepartment = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      departmentID: Joi.string()
        .uuid({ version: "uuidv4" })
        .optional()
        .allow(null),
      callCategoryID: Joi.string()
        .uuid({ version: "uuidv4" })
        .optional()
        .allow(null),
    }).oxor("departmentID", "callCategoryID");
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCallCenter.getCallCenterDepartmentList(
      req.query
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

const saveCallCenterDepartment = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string()
        .uuid({
          version: "uuidv4",
        })
        .required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow(null),
      categoryID: Joi.string()
        .uuid({
          version: "uuidv4",
        })
        .required(),
      botID: Joi.string().uuid({ version: "uuidv4" }).allow(null),
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCallCenter.saveCallCenterDepartment(
      req.query,
      req.body
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

const updateCallCenterDepartment = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string()
        .uuid({
          version: "uuidv4",
        })
        .required(),
      departmentID: Joi.string()
        .uuid({
          version: "uuidv4",
        })
        .required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow(null),
      categoryID: Joi.string()
        .uuid({
          version: "uuidv4",
        })
        .required(),
      botID: Joi.string()
        .uuid({
          version: "uuidv4",
        })
        .allow(null),
      status: Joi.boolean().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCallCenter.updateCallCenterDepartment(
      req.query,
      req.body
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

const deleteCallCenterDepartment = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCallCenter.deleteCallCenterDepartment(
      req.query
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

const getCallCenterDepartmentAgent = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      departmentID: Joi.string()
        .uuid({ version: "uuidv4" })
        .optional()
        .allow(null),
      userID: Joi.string().uuid({ version: "uuidv4" }).optional().allow(null),
    }).oxor("userID", "departmentID");

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCallCenter.getCallCenterDepartmentAgentList(
      req.query
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

const saveCallCenterDepartmentAgent = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });
    const { error: queryError } = querySchema.validate(req.query);

    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      agentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      stock: Joi.number().min(1).max(10).required(),
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCallCenter.saveCallCenterDepartmentAgent(
      req.query,
      req.body
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

const updateCallCenterDepartmentAgent = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      agentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      stock: Joi.number().min(1).max(10).required(),
      isPriority: Joi.boolean().optional().allow(null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCallCenter.updateCallCenterDepartmentAgent(
      req.query,
      req.body
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

const deleteCallCenterDepartmentAgent = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      agentID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCallCenter.deleteCallCenterDepartmentAgent(
      req.query
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

const getCallCenterDepartmentSchedule = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      scheduleID: Joi.string()
        .uuid({ version: "uuidv4" })
        .optional()
        .allow(null),
    });

    const { error: queryError } = querySchema.validate(req.query);

    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCallCenter.getCallCenterDepartmentScheduleList(
      req.query
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

const saveCallCenterDepartmentSchedule = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      dayOfWeek: Joi.string().required(),
      period: Joi.string().required(),
      startTime: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
      endTime: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCallCenter.saveCallCenterDepartmentSchedule(
      req.query,
      req.body
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

const updateCallCenterDepartmentSchedule = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      scheduleID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      dayOfWeek: Joi.string().required(),
      period: Joi.string().required(),
      startTime: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
      endTime: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCallCenter.updateCallCenterDepartmentSchedule(
      req.query,
      req.body
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

const deleteCallCenterDepartmentSchedule = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      scheduleID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCallCenter.deleteCallCenterDepartmentSchedule(
      req.query
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

const getCallCenterDepartmentScheduleOff = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      scheduleOffID: Joi.string()
        .uuid({ version: "uuidv4" })
        .optional()
        .allow(null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response =
      await modelCallCenter.getCallCenterDepartmentScheduleOffList(req.query);

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

const saveCallCenterDepartmentScheduleOff = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      date: Joi.date().iso().required(),
      reason: Joi.string().allow(null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCallCenter.saveCallCenterDepartmentScheduleOff(
      req.query,
      req.body
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

const updateCallCenterDepartmentScheduleOff = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      scheduleOffID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      date: Joi.date().iso().required(),
      reason: Joi.string().allow(null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response =
      await modelCallCenter.updateCallCenterDepartmentScheduleOff(
        req.query,
        req.body
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

const deleteCallCenterDepartmentScheduleOff = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      scheduleOffID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response =
      await modelCallCenter.deleteCallCenterDepartmentScheduleOff(req.query);

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

const getCallCenterQuickResponse = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      quickResponseID: Joi.string()
        .uuid({ version: "uuidv4" })
        .optional()
        .allow(null),
      agentID: Joi.string().uuid({ version: "uuidv4" }).optional().allow(null),
      departmentID: Joi.string()
        .uuid({ version: "uuidv4" })
        .optional()
        .allow(null),
    }).xor("quickResponseID", "agentID", "departmentID");

    const { error: queryError } = querySchema.validate(req.query);

    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCallCenter.getCallCenterQuickResponseList(
      req.query
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

const saveCallCenterQuickResponse = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      agentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }
    const bodySchema = Joi.object({
      response: Joi.string().required(),
      title: Joi.string().allow(null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCallCenter.saveCallCenterQuickResponse(
      req.query,
      req.body
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

const updateCallCenterQuickResponse = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      agentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      quickResponseID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      response: Joi.string().required(),
      title: Joi.string().allow(null),
      is_active: Joi.boolean().required(),
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelCallCenter.updateCallCenterQuickResponse(
      req.query,
      req.body
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

const deleteCallCenterQuickResponse = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      agentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      quickResponseID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelCallCenter.deleteCallCenterQuickResponse(
      req.query
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

const getCallCenterChatByStatus = async (req, res) => {
  try {
    const querySchema = Joi.object({
      agentID: Joi.string().uuid({ version: "uuidv4" }),
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      status: Joi.string().valid("IN_PROGRESS", "ASSIGNED").required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { user } = req.unique_token;
    req.query.user = user;

    const response = await modelCallCenter.getChatsByStatus(req.query);

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

const updateCallCenterChatStatus = async (req, res) => {
  try {
    const querySchema = Joi.object({
      sessionID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      status: Joi.string()
        .valid("REASSIGNED", "IN_PROGRESS", "CLOSED", "TRANSFERRED")
        .required(),
      agentID: Joi.string()
        .uuid({ version: "uuidv4" })
        .when(Joi.ref("status"), {
          is: "REASSIGNED",
          then: Joi.required(),
        }),
      departmentID: Joi.string()
        .uuid({ version: "uuidv4" })
        .when(Joi.ref("status"), {
          is: "TRANSFERRED",
          then: Joi.required(),
        }),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { user } = req.unique_token;
    req.query.user = user;

    const response = await modelCallCenter.updateChatStatus(
      req.query,
      req.body
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

const getCallCenterClosedChats = async (req, res) => {
  try {
    const querySchema = Joi.object({
      agentID: Joi.string().uuid({ version: "uuidv4" }),
      departmentID: Joi.string().uuid({ version: "uuidv4" }).required(),
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { user } = req.unique_token;
    req.query.user = user;

    const response = await modelCallCenter.getClosedChats(req.query);

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
  getCallCenterCategory,
  saveCallCenterCategory,
  updateCallCenterCategory,
  deleteCallCenterCategory,
  getCallCenterDepartment,
  saveCallCenterDepartment,
  updateCallCenterDepartment,
  deleteCallCenterDepartment,
  getCallCenterDepartmentAgent,
  saveCallCenterDepartmentAgent,
  deleteCallCenterDepartmentAgent,
  getCallCenterDepartmentSchedule,
  saveCallCenterDepartmentSchedule,
  updateCallCenterDepartmentSchedule,
  deleteCallCenterDepartmentSchedule,
  getCallCenterDepartmentScheduleOff,
  saveCallCenterDepartmentScheduleOff,
  updateCallCenterDepartmentScheduleOff,
  deleteCallCenterDepartmentScheduleOff,
  getCallCenterQuickResponse,
  saveCallCenterQuickResponse,
  updateCallCenterQuickResponse,
  deleteCallCenterQuickResponse,
  updateCallCenterDepartmentAgent,
  getCallCenterChatByStatus,
  updateCallCenterChatStatus,
  getCallCenterClosedChats,
};
