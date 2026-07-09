const dayjs = require("dayjs");
const crypto = require("crypto");

const repoCallCenter = require("../repositories/callcenter");
const repoCompany = require("../repositories/company");
const repoAccount = require("../repositories/accounts");
const repoBots = require("../repositories/bots");
const repoAWS = require("../repositories/aws");
const { socialContactsRepository } = require("../repositories/social");
const repoAccounts = require("../repositories/accounts");

const validateWeekAndPeriod = require("../utils/validateWeekAndPeriod");
const { sendDataToInstance } = require("../utils/sendDataToInstance");
const { sendMessageBot } = require("./bots");
const {
  generateSessionEventLog,
} = require("../utils/createSessionLogTemplate");
const { BOT_EVENTS } = require("../utils/events");
const createBotQueue = require("../utils/rabbit/createBotQueue");

const getCallCenterCategoryList = async (query) => {
  try {
    const { callCategoryID, callParentID, companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const callCenterCategory =
      await repoCallCenter.getCallCenterCategoriesByField({
        "call_center_categories.company_id": companyID,
        ...(callCategoryID && {
          "call_center_categories.uuid_unique": callCategoryID,
        }),
        ...(callParentID && {
          "call_center_categories.parent_id": callParentID,
        }),
      });

    return callCenterCategory.filter((item) => {
      if (item.parent_name === null) {
        delete item.parent_name;
      }
      return item;
    });
  } catch (error) {
    throw new Error(error);
  }
};

const saveCallCenterCategory = async (query, body) => {
  try {
    const { companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const { name, keywords, callParentID } = body;

    if (callParentID) {
      const [parentCategory] =
        await repoCallCenter.getCallCenterCategoriesByField({
          "call_center_categories.uuid_unique": callParentID,
          "call_center_categories.company_id": companyID,
        });
      if (!parentCategory) {
        throw new Error(
          `Call Parent category ID ${callParentID} does not exist`
        );
      }
    }

    const [existingCategory] =
      await repoCallCenter.getCallCenterCategoriesByField({
        "call_center_categories.company_id": companyID,
        "call_center_categories.name": name,
        ...(callParentID && {
          "call_center_categories.parent_id": callParentID,
        }),
      });
    if (existingCategory) {
      throw new Error(
        `Category with name ${name}${
          callParentID ? ` and Parent ID ${callParentID}` : ""
        } already exists at company ${companyID}`
      );
    }

    const dataToSave = {
      "call_center_categories.company_id": companyID,
      "call_center_categories.name": name,
      ...(keywords && { "call_center_categories.keywords": keywords }),
      ...(callParentID && {
        "call_center_categories.parent_id": callParentID,
      }),
    };

    return await repoCallCenter.saveCallCenterCategory(dataToSave);
  } catch (error) {
    throw new Error(error);
  }
};

const updateCallCenterCategory = async (query, data) => {
  try {
    const { callCategoryID, companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [existingCategory] =
      await repoCallCenter.getCallCenterCategoriesByField({
        "call_center_categories.company_id": companyID,
        "call_center_categories.uuid_unique": callCategoryID,
      });
    if (!existingCategory) {
      throw new Error(`Category with ID ${callCategoryID} does not exist`);
    }

    const fieldsToUpdate = ["name", "keywords", "parent_id"];

    let dataToUpdate = {};

    fieldsToUpdate.forEach((field) => {
      const dataField = field === "parent_id" ? "callParentID" : field;
      if (
        data[dataField] !== undefined &&
        data[dataField] !== existingCategory[field]
      ) {
        dataToUpdate[field] = data[dataField];
      }
    });

    if (Object.keys(dataToUpdate).length > 0) {
      const whereToUpdate = {
        "call_center_categories.company_id": companyID,
        "call_center_categories.uuid_unique": callCategoryID,
      };
      return await repoCallCenter.updateCallCenterCategory(
        whereToUpdate,
        dataToUpdate
      );
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteCallCenterCategory = async (query) => {
  try {
    const { callCategoryID, companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [existingCategory] =
      await repoCallCenter.getCallCenterCategoriesByField({
        "call_center_categories.company_id": companyID,
        "call_center_categories.uuid_unique": callCategoryID,
      });
    if (!existingCategory) {
      throw new Error(`Category with ID ${callCategoryID} does not exist`);
    }

    const existingSubCategories =
      await repoCallCenter.getCallCenterCategoriesByField({
        "call_center_categories.parent_id": callCategoryID,
        "call_center_categories.company_id": companyID,
      });
    if (existingSubCategories.length > 0) {
      throw new Error(`Category with ID ${callCategoryID} has subcategories`);
    }
    const departmentFields =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.company_id": companyID,
        "call_center_departments.category_id": callCategoryID,
      });
    if (departmentFields.length > 0) {
      throw new Error(
        `Category with ID ${callCategoryID} is in use in departments`
      );
    }

    const whereToDelete = {
      "call_center_categories.company_id": companyID,
      "call_center_categories.uuid_unique": callCategoryID,
    };
    return await repoCallCenter.deleteCallCenterCategory(whereToDelete);
  } catch (error) {
    throw new Error(error);
  }
};

const getCallCenterDepartmentList = async (query) => {
  try {
    const { companyID, departmentID, callCategoryID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    if (callCategoryID) {
      const [categoryField] =
        await repoCallCenter.getCallCenterCategoriesByField({
          "call_center_categories.uuid_unique": callCategoryID,
          "call_center_categories.company_id": companyID,
        });
      if (!categoryField) {
        throw new Error(
          `Category with ID ${callCategoryID} does not exist for company ${companyID}`
        );
      }
    }

    return await repoCallCenter.getCallCenterDepartmentsByField({
      "call_center_departments.company_id": companyID,
      ...(departmentID && {
        "call_center_departments.uuid_unique": departmentID,
      }),
      ...(callCategoryID && {
        "call_center_departments.category_id": callCategoryID,
      }),
    });
  } catch (error) {
    throw new Error(error);
  }
};

const saveCallCenterDepartment = async (query, body) => {
  try {
    const { companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const { name, description, categoryID, botID } = body;

    const [categoryField] = await repoCallCenter.getCallCenterCategoriesByField(
      {
        "call_center_categories.uuid_unique": categoryID,
        "call_center_categories.company_id": companyID,
      }
    );
    if (!categoryField) {
      throw new Error(
        `Category with ID ${categoryID} does not exist for company ${companyID}`
      );
    }

    if (botID) {
      const [botField] = await repoBots.getBotsByField({
        "bots.uuid_unique": botID,
        "bots.company_id": companyID,
      });
      if (!botField) {
        throw new Error(
          `Bot with ID ${botID} does not exist for company ${companyID}`
        );
      }
    }

    const [existingDepartment] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.company_id": companyID,
        "call_center_departments.name": name,
      });

    if (existingDepartment) {
      throw new Error(
        `Department with name ${name} already exists for company ${companyID}`
      );
    }

    return await repoCallCenter.saveCallCenterDepartment({
      "call_center_departments.company_id": companyID,
      "call_center_departments.category_id": categoryID,
      "call_center_departments.name": name,
      ...(description && {
        "call_center_departments.description": description,
      }),
      ...(botID && { "call_center_departments.bot_id": botID }),
    });
  } catch (error) {
    throw new Error(error);
  }
};

const updateCallCenterDepartment = async (query, data) => {
  try {
    const { departmentID, companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [existingDepartment] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.company_id": companyID,
        "call_center_departments.uuid_unique": departmentID,
      });
    if (!existingDepartment) {
      throw new Error(`Department with ID ${departmentID} does not exist`);
    }

    const fieldsToUpdate = [
      "name",
      "description",
      "category_id",
      "status",
      "bot_id",
    ];

    let dataToUpdate = {};

    fieldsToUpdate.forEach(async (field) => {
      const dataField =
        {
          category_id: "categoryID",
          bot_id: "botID",
        }[field] || field;
      if (
        data[dataField] !== undefined &&
        data[dataField] != existingDepartment[field]
      ) {
        dataToUpdate[field] = data[dataField];
      }
    });

    if (Object.keys(dataToUpdate).length > 0) {
      const whereToUpdate = {
        "call_center_departments.company_id": companyID,
        "call_center_departments.uuid_unique": departmentID,
      };
      return await repoCallCenter.updateCallCenterDepartment(
        whereToUpdate,
        dataToUpdate
      );
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteCallCenterDepartment = async (query) => {
  try {
    const { departmentID, companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [existingDepartment] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.company_id": companyID,
        "call_center_departments.uuid_unique": departmentID,
      });
    if (!existingDepartment) {
      throw new Error(`Department with ID ${departmentID} does not exist`);
    }

    const membersField = await repoCallCenter.getDepartmentAgentsByField({
      "call_center_departments_agents.department_id": departmentID,
    });

    if (membersField.length > 0) {
      throw new Error(
        `Department with ID ${departmentID} has members assigned`
      );
    }

    const whereToDelete = {
      "call_center_departments.company_id": companyID,
      "call_center_departments.uuid_unique": departmentID,
    };
    return await repoCallCenter.deleteCallCenterDepartment(whereToDelete);
  } catch (error) {
    throw new Error(error);
  }
};

const getCallCenterDepartmentAgentList = async (query) => {
  try {
    const { companyID, departmentID, userID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    if (departmentID) {
      const [departmentField] =
        await repoCallCenter.getCallCenterDepartmentsByField({
          "call_center_departments.uuid_unique": departmentID,
          "call_center_departments.company_id": companyID,
        });

      if (!departmentField) {
        throw new Error(
          `Department with ID ${departmentID} does not exist for company ${companyID}`
        );
      }
    }

    if (userID) {
      const [accountField] = await repoAccount.getAccountByField({
        "accounts.uuid_unique": userID,
        "accounts.company_id": companyID,
      });
      if (!accountField) {
        throw new Error(
          `Agent with ID ${userID} does not exist for company ${companyID}`
        );
      }
      const { role_key } = accountField;

      if (role_key !== "ADVISOR") {
        throw new Error(`User with ID ${userID} is not an advisor`);
      }
    }

    if (!userID && !departmentID) {
      const accounts = await repoAccount.getAccountByField({
        "accounts.company_id": companyID,
      });

      const agents = accounts.filter(
        (account) => account.role_key === "ADVISOR"
      );

      if (!agents.length) {
        throw new Error(`No agents found for company ID ${companyID}`);
      }

      return (
        await Promise.all(
          agents.map(async (agent) => {
            return await repoCallCenter.getDepartmentAgentsByField({
              "call_center_departments_agents.agent_id": agent.uuid_unique,
            });
          })
        )
      ).flat();
    } else {
      return await repoCallCenter.getDepartmentAgentsByField({
        ...(departmentID && {
          "call_center_departments_agents.department_id": departmentID,
        }),
        ...(userID && {
          "call_center_departments_agents.agent_id": userID,
        }),
      });
    }
  } catch (error) {
    throw new Error(error);
  }
};

const saveCallCenterDepartmentAgent = async (query, data) => {
  try {
    const { companyID } = query;
    const { departmentID, agentID, stock } = data;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": companyID,
      });
    if (!departmentField) {
      throw new Error(
        `Department with ID ${departmentID} does not exist for company ${companyID}`
      );
    }

    const [accountField] = await repoAccount.getAccountByField({
      "accounts.uuid_unique": agentID,
      "accounts.company_id": companyID,
    });
    if (!accountField) {
      throw new Error(
        `Agent with ID ${agentID} does not exist for company ${companyID}`
      );
    }

    const { role_key } = accountField;

    if (role_key !== "ADVISOR") {
      throw new Error(`User with ID ${agentID} is not an advisor`);
    }

    const [existingAgent] = await repoCallCenter.getDepartmentAgentsByField({
      "call_center_departments_agents.department_id": departmentID,
      "call_center_departments_agents.agent_id": agentID,
    });

    if (existingAgent) {
      throw new Error(
        `Agent with ID ${agentID} already exists in department ${departmentID}`
      );
    }

    return await repoCallCenter.saveDepartmentAgent({
      "call_center_departments_agents.department_id": departmentID,
      "call_center_departments_agents.agent_id": agentID,
      "call_center_departments_agents.stock": stock,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const updateCallCenterDepartmentAgent = async (query, data) => {
  try {
    const { companyID } = query;
    const { departmentID, agentID } = data;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": companyID,
      });
    if (!departmentField) {
      throw new Error(
        `Department with ID ${departmentID} does not exist for company ${companyID}`
      );
    }

    const [accountField] = await repoAccount.getAccountByField({
      "accounts.uuid_unique": agentID,
      "accounts.company_id": companyID,
    });
    if (!accountField) {
      throw new Error(
        `Agent with ID ${agentID} does not exist for company ${companyID}`
      );
    }

    const { role_key } = accountField;

    if (role_key !== "ADVISOR") {
      throw new Error(`User with ID ${agentID} is not an advisor`);
    }

    const [existingAgent] = await repoCallCenter.getDepartmentAgentsByField({
      "call_center_departments_agents.department_id": departmentID,
      "call_center_departments_agents.agent_id": agentID,
    });
    if (!existingAgent) {
      throw new Error(
        `Agent with ID ${agentID} does not exist in department ${departmentID}`
      );
    }

    const fieldsToUpdate = ["stock", "is_priority"];

    let dataToUpdate = {};

    fieldsToUpdate.forEach((field) => {
      const dataField = field === "is_priority" ? "isPriority" : field;
      if (
        data[dataField] !== undefined &&
        data[dataField] !== existingAgent[field]
      ) {
        dataToUpdate[field] = data[dataField];
      }
    });

    if (Object.keys(dataToUpdate).length > 0) {
      const whereToUpdate = {
        "call_center_departments_agents.department_id": departmentID,
        "call_center_departments_agents.agent_id": agentID,
      };
      return await repoCallCenter.updateDepartmentAgent(
        whereToUpdate,
        dataToUpdate
      );
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteCallCenterDepartmentAgent = async (query) => {
  try {
    const { companyID, departmentID, agentID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": companyID,
      });
    if (!departmentField) {
      throw new Error(
        `Department with ID ${departmentID} does not exist for company ${companyID}`
      );
    }

    const [accountField] = await repoAccount.getAccountByField({
      "accounts.uuid_unique": agentID,
      "accounts.company_id": companyID,
    });
    if (!accountField) {
      throw new Error(
        `Agent with ID ${agentID} does not exist for company ${companyID}`
      );
    }

    const { role_key } = accountField;

    if (role_key !== "ADVISOR") {
      throw new Error(`User with ID ${agentID} is not an advisor`);
    }

    const [existingAgent] = await repoCallCenter.getDepartmentAgentsByField({
      "call_center_departments_agents.department_id": departmentID,
      "call_center_departments_agents.agent_id": agentID,
    });

    if (!existingAgent) {
      throw new Error(
        `Agent with ID ${agentID} does not exist in department ${departmentID}`
      );
    }

    return await repoCallCenter.deleteDepartmentAgent({
      "call_center_departments_agents.department_id": departmentID,
      "call_center_departments_agents.agent_id": agentID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const getCallCenterDepartmentScheduleList = async (query) => {
  try {
    const { companyID, departmentID, scheduleID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": companyID,
      });
    if (!departmentField) {
      throw new Error(
        `Department with ID ${departmentID} does not exist for company ${companyID}`
      );
    }

    return await repoCallCenter.getDepartmentScheduleByField({
      "dp_schedule.department_id": departmentID,
      ...(scheduleID && {
        "dp_schedule.uuid_unique": scheduleID,
      }),
    });
  } catch (error) {
    throw new Error(error);
  }
};

const saveCallCenterDepartmentSchedule = async (query, body) => {
  try {
    const { companyID, departmentID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": companyID,
      });
    if (!departmentField) {
      throw new Error(
        `Department with ID ${departmentID} does not exist for company ${companyID}`
      );
    }

    const { dayOfWeek, period, startTime, endTime } = body;

    const { dayName, periodName } = await validateWeekAndPeriod(
      period,
      dayOfWeek
    );

    const working_start = dayjs(startTime, "HH:mm", true);
    const working_end = dayjs(endTime, "HH:mm", true);

    if (!working_start.isValid() || !working_end.isValid()) {
      throw new Error("Invalid end or start time");
    }

    if (working_end.isBefore(working_start)) {
      throw new Error("End time must be after start time");
    }

    const [existingSchedule] =
      await repoCallCenter.getDepartmentScheduleByField({
        "dp_schedule.department_id": departmentID,
        "dp_schedule.day_of_week": dayName,
        "dp_schedule.period": periodName,
      });
    if (existingSchedule) {
      throw new Error(
        `Schedule with day of week ${dayName} and period ${periodName} already exists`
      );
    }

    return await repoCallCenter.saveDepartmentSchedule({
      "dp_schedule.department_id": departmentID,
      "dp_schedule.day_of_week": dayName,
      "dp_schedule.period": periodName,
      "dp_schedule.start_time": working_start.format("HH:mm").toString(),
      "dp_schedule.end_time": working_end.format("HH:mm").toString(),
    });
  } catch (error) {
    throw new Error(error);
  }
};

const updateCallCenterDepartmentSchedule = async (query, data) => {
  try {
    const { companyID, departmentID, scheduleID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": companyID,
      });
    if (!departmentField) {
      throw new Error(
        `Department with ID ${departmentID} does not exist for company ${companyID}`
      );
    }

    const [existingSchedule] =
      await repoCallCenter.getDepartmentScheduleByField({
        "dp_schedule.uuid_unique": scheduleID,
        "dp_schedule.department_id": departmentID,
      });
    if (!existingSchedule) {
      throw new Error(`Schedule with ID ${scheduleID} does not exist`);
    }

    const { dayOfWeek, period, startTime, endTime } = data;

    await validateWeekAndPeriod(period, dayOfWeek);

    const working_start = dayjs(startTime, "HH:mm", true);
    const working_end = dayjs(endTime, "HH:mm", true);

    if (!working_start.isValid() || !working_end.isValid()) {
      throw new Error("Invalid end or start time");
    }

    if (working_end.isBefore(working_start)) {
      throw new Error("End time must be after start time");
    }

    const fieldsToUpdate = ["day_of_week", "period", "start_time", "end_time"];

    let dataToUpdate = {};

    fieldsToUpdate.forEach((field) => {
      const dataField =
        {
          day_of_week: "dayOfWeek",
          start_time: "startTime",
          end_time: "endTime",
        }[field] || field;
      if (
        data[dataField] != undefined &&
        data[dataField] !== existingSchedule[field]
      ) {
        dataToUpdate[field] = data[dataField];
      }
    });
    if (Object.keys(dataToUpdate).length > 0) {
      const whereToUpdate = {
        "dp_schedule.uuid_unique": scheduleID,
        "dp_schedule.department_id": departmentID,
      };
      return await repoCallCenter.updateDepartmentSchedule(
        whereToUpdate,
        dataToUpdate
      );
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteCallCenterDepartmentSchedule = async (query) => {
  try {
    const { companyID, departmentID, scheduleID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": companyID,
      });

    if (!departmentField) {
      throw new Error(
        `Department with ID ${departmentID} does not exist for company ${companyID}`
      );
    }

    const [existingSchedule] =
      await repoCallCenter.getDepartmentScheduleByField({
        "dp_schedule.uuid_unique": scheduleID,
        "dp_schedule.department_id": departmentID,
      });
    if (!existingSchedule) {
      throw new Error(`Schedule with ID ${scheduleID} does not exist`);
    }

    return await repoCallCenter.deleteDepartmentSchedule({
      "dp_schedule.uuid_unique": scheduleID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const getCallCenterDepartmentScheduleOffList = async (query) => {
  try {
    const { companyID, departmentID, scheduleOffID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": companyID,
      });
    if (!departmentField) {
      throw new Error(
        `Department with ID ${departmentID} does not exist for company ${companyID}`
      );
    }

    return await repoCallCenter.getDepartmentScheduleOffByField({
      "call_center_department_schedule_off.department_id": departmentID,
      ...(scheduleOffID && {
        "call_center_department_schedule_off.uuid_unique": scheduleOffID,
      }),
    });
  } catch (error) {
    throw new Error(error);
  }
};

const saveCallCenterDepartmentScheduleOff = async (query, body) => {
  try {
    const { companyID, departmentID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": companyID,
      });
    if (!departmentField) {
      throw new Error(
        `Department with ID ${departmentID} does not exist for company ${companyID}`
      );
    }

    const { date, reason } = body;

    const [existingScheduleOff] =
      await repoCallCenter.getDepartmentScheduleOffByField({
        "call_center_department_schedule_off.department_id": departmentID,
        "call_center_department_schedule_off.date": date,
      });
    if (existingScheduleOff) {
      throw new Error(`Schedule off for date ${date} already exists`);
    }

    return await repoCallCenter.saveDepartmentScheduleOff({
      "call_center_department_schedule_off.department_id": departmentID,
      "call_center_department_schedule_off.date": date,
      ...(reason && { "call_center_department_schedule_off.reason": reason }),
    });
  } catch (error) {
    throw new Error(error);
  }
};

const updateCallCenterDepartmentScheduleOff = async (query, data) => {
  try {
    const { companyID, departmentID, scheduleOffID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": companyID,
      });
    if (!departmentField) {
      throw new Error(
        `Department with ID ${departmentID} does not exist for company ${companyID}`
      );
    }

    const [existingScheduleOff] =
      await repoCallCenter.getDepartmentScheduleOffByField({
        "call_center_department_schedule_off.uuid_unique": scheduleOffID,
        "call_center_department_schedule_off.department_id": departmentID,
      });
    if (!existingScheduleOff) {
      throw new Error(`Schedule off with ID ${scheduleOffID} does not exist`);
    }

    const fieldsToUpdate = ["date", "reason"];

    let dataToUpdate = {};

    fieldsToUpdate.forEach((field) => {
      if (
        data[field] !== undefined &&
        data[field] !== existingScheduleOff[field]
      ) {
        dataToUpdate[field] = data[field];
      }
    });

    if (Object.keys(dataToUpdate).length > 0) {
      const whereToUpdate = {
        "call_center_department_schedule_off.uuid_unique": scheduleOffID,
        "call_center_department_schedule_off.department_id": departmentID,
      };
      return await repoCallCenter.updateDepartmentScheduleOff(
        whereToUpdate,
        dataToUpdate
      );
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteCallCenterDepartmentScheduleOff = async (query) => {
  try {
    const { companyID, deparmentID, scheduleOffID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": deparmentID,
        "call_center_departments.company_id": companyID,
      });
    if (!departmentField) {
      throw new Error(
        `Department with ID ${deparmentID} does not exist for company ${companyID}`
      );
    }

    const [existingScheduleOff] =
      await repoCallCenter.getDepartmentScheduleOffByField({
        "call_center_department_schedule_off.uuid_unique": scheduleOffID,
        "call_center_department_schedule_off.deparment_id": deparmentID,
      });
    if (!existingScheduleOff) {
      throw new Error(`Schedule off with ID ${scheduleOffID} does not exist`);
    }

    return await repoCallCenter.deleteDepartmentScheduleOff({
      "call_center_department_schedule_off.uuid_unique": scheduleOffID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const getCallCenterQuickResponseList = async (query) => {
  try {
    const { companyID, quickResponseID, agentID, departmentID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    if (agentID) {
      const [accountField] = await repoAccount.getAccountByField({
        "accounts.uuid_unique": agentID,
        "accounts.company_id": companyID,
      });
      if (!accountField) {
        throw new Error(
          `Agent with ID ${agentID} does not exist for company ${companyID}`
        );
      }

      const { role_key } = accountField;

      if (role_key !== "ADVISOR") {
        throw new Error(`User with ID ${agentID} is not an advisor`);
      }
    }

    if (departmentID) {
      const [departmentField] =
        await repoCallCenter.getCallCenterDepartmentsByField({
          "call_center_departments.uuid_unique": departmentID,
          "call_center_departments.company_id": companyID,
        });
      if (!departmentField) {
        throw new Error(
          `Department with ID ${departmentID} does not exist for company ${companyID}`
        );
      }
    }

    return await repoCallCenter.getQuickResponsesByField({
      ...(quickResponseID && {
        "call_center_agents_quick_responses.uuid_unique": quickResponseID,
      }),
      ...(agentID && {
        "call_center_agents_quick_responses.agent_id": agentID,
      }),
      ...(departmentID && {
        "call_center_agents_quick_responses.department_id": departmentID,
      }),
    });
  } catch (error) {
    throw new Error(error);
  }
};

const saveCallCenterQuickResponse = async (query, body) => {
  try {
    const { companyID, agentID, departmentID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [accountField] = await repoAccount.getAccountByField({
      "accounts.uuid_unique": agentID,
      "accounts.company_id": companyID,
    });
    if (!accountField) {
      throw new Error(
        `Agent with ID ${agentID} does not exist for company ${companyID}`
      );
    }

    const { role_key } = accountField;
    if (role_key !== "ADVISOR") {
      throw new Error(`User with ID ${agentID} is not an advisor`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": companyID,
      });
    if (!departmentField) {
      throw new Error(
        `Department with ID ${departmentID} does not exist for company ${companyID}`
      );
    }

    const [existingDepartmentAgent] =
      await repoCallCenter.getDepartmentAgentsByField({
        "call_center_departments_agents.department_id": departmentID,
        "call_center_departments_agents.agent_id": agentID,
      });
    if (!existingDepartmentAgent) {
      throw new Error(
        `Agent with ID ${agentID} is not in department ${departmentID}`
      );
    }

    const { response, title } = body;

    const responseHash = crypto
      .createHash("sha256")
      .update(response)
      .digest("hex");

    const [existingQuickResponse] =
      await repoCallCenter.getQuickResponsesByField({
        "call_center_agents_quick_responses.agent_id": agentID,
        "call_center_agents_quick_responses.department_id": departmentID,
        "call_center_agents_quick_responses.response_hash": responseHash,
        ...(title && { "call_center_agents_quick_responses.title": title }),
      });
    if (existingQuickResponse) {
      throw new Error(
        `Quick Response already exists for agent ID ${agentID} in this department ID ${departmentID}`
      );
    }

    return await repoCallCenter.saveQuickResponse({
      "call_center_agents_quick_responses.agent_id": agentID,
      "call_center_agents_quick_responses.department_id": departmentID,
      "call_center_agents_quick_responses.response": response,
      "call_center_agents_quick_responses.response_hash": responseHash,
      ...(title && { "call_center_agents_quick_responses.title": title }),
    });
  } catch (error) {
    throw new Error(error);
  }
};

const updateCallCenterQuickResponse = async (query, data) => {
  try {
    const { quickResponseID, companyID, agentID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [accountField] = await repoAccount.getAccountByField({
      "accounts.uuid_unique": agentID,
      "accounts.company_id": companyID,
    });
    if (!accountField) {
      throw new Error(
        `Agent with ID ${agentID} does not exist for company ${companyID}`
      );
    }

    const { role_key } = accountField;

    if (role_key !== "ADVISOR") {
      throw new Error(`User with ID ${agentID} is not an advisor`);
    }

    const [existingQuickResponse] =
      await repoCallCenter.getQuickResponsesByField({
        "call_center_agents_quick_responses.uuid_unique": quickResponseID,
        "call_center_agents_quick_responses.agent_id": agentID,
      });
    if (!existingQuickResponse) {
      throw new Error(
        `Quick Response with ID ${quickResponseID} does not exist`
      );
    }

    const fieldsToUpdate = ["response", "title", "is_active"];

    let dataToUpdate = {};

    fieldsToUpdate.forEach((field) => {
      if (field === "response") {
        const responseHash = crypto
          .createHash("sha256")
          .update(data[field])
          .digest("hex");
        if (responseHash !== existingQuickResponse["response_hash"]) {
          dataToUpdate["response"] = data[field];
          dataToUpdate["response_hash"] = responseHash;
        }
      } else if (
        data[field] !== undefined &&
        data[field] !== existingQuickResponse[field]
      ) {
        dataToUpdate[field] = data[field];
      }
    });

    if (Object.keys(dataToUpdate).length > 0) {
      const whereToUpdate = {
        "call_center_agents_quick_responses.uuid_unique": quickResponseID,
        "call_center_agents_quick_responses.agent_id": agentID,
      };
      return await repoCallCenter.updateQuickResponse(
        whereToUpdate,
        dataToUpdate
      );
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteCallCenterQuickResponse = async (query) => {
  try {
    const { quickResponseID, companyID, agentID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} does not exist`);
    }

    const [accountField] = await repoAccount.getAccountByField({
      "accounts.uuid_unique": agentID,
      "accounts.company_id": companyID,
    });
    if (!accountField) {
      throw new Error(
        `Agent with ID ${agentID} does not exist for company ${companyID}`
      );
    }

    const { role_key } = accountField;

    if (role_key !== "ADVISOR") {
      throw new Error(`User with ID ${agentID} is not an advisor`);
    }

    const [existingQuickResponse] =
      await repoCallCenter.getQuickResponsesByField({
        "call_center_agents_quick_responses.uuid_unique": quickResponseID,
        "call_center_agents_quick_responses.agent_id": agentID,
      });
    if (!existingQuickResponse) {
      throw new Error(
        `Quick Response with ID ${quickResponseID} does not exist`
      );
    }

    return await repoCallCenter.deleteQuickResponse({
      "call_center_agents_quick_responses.uuid_unique": quickResponseID,
      "call_center_agents_quick_responses.agent_id": agentID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const sendCallCenterDepartments = async (data) => {
  try {
    const { bot_id } = data;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": bot_id,
    });
    if (!botField) {
      throw new Error(`Bot with ID ${bot_id} does not exist`);
    }

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": botField.company_id,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${botField.company_id} does not exist`);
    }

    const departments = await repoCallCenter.getCallCenterDepartmentsByField({
      "call_center_departments.company_id": companyField.uuid_unique,
    });

    if (!departments.length) {
      throw new Error(
        `No departments found for company ${companyField.uuid_unique}`
      );
    }

    const departmentsToSend = departments.map((department) => {
      return {
        department_id: department.uuid_unique,
        name: department.name,
      };
    });

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": bot_id,
    });
    if (!instanceBotField) {
      throw new Error(`Bot with ID ${bot_id} does not have an instance.`);
    }

    const botQueue = createBotQueue(bot_id);
    await sendDataToInstance(
      botQueue,
      BOT_EVENTS.SET_CALL_CENTER_DEPARTMENTS,
      {
        bot_id,
        departments: departmentsToSend,
      }
    );
  } catch (error) {
    throw new Error(error);
  }
};

const saveDepartmentDerivationQueue = async (data) => {
  try {
    const { bot_id, department_id, phone } = data;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": bot_id,
    });
    if (!botField) {
      throw new Error(`Bot with ID ${bot_id} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": department_id,
        "call_center_departments.company_id": botField.company_id,
      });

    if (!departmentField) {
      throw new Error(`Department with ID ${department_id} does not exist`);
    }

    const {
      result: [contactField],
    } = await socialContactsRepository.getByField({
      "social_contacts.contact_id": phone,
      "social_contacts.network_id": botField.network_id,
    });

    if (!contactField) {
      throw new Error(`Contact with ID ${phone} does not exist`);
    }

    const [existingQueue] = await repoCallCenter.getCallCenterQueueChatsByField(
      {
        "call_center_queue_chats.department_id": department_id,
        "call_center_queue_chats.contact_id": contactField.uuid_unique,
        "call_center_queue_chats.bot_id": bot_id,
        "call_center_queue_chats.status": "PENDING",
      }
    );

    if (existingQueue) {
      const message = `You already have a pending request in the ${departmentField.name} department. Please wait for an agent to assist you.`;
      await sendMessageBot({ botID: bot_id }, { message, phone });
    } else {
      await repoCallCenter.saveCallCenterQueueChat({
        "call_center_queue_chats.department_id": department_id,
        "call_center_queue_chats.contact_id": contactField.uuid_unique,
        "call_center_queue_chats.bot_id": bot_id,
      });
    }
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

const cancelDepartmentQueue = async (data) => {
  try {
    const { bot_id: botID, phone, department_id } = data;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot with ID ${botID} does not exist`);
    }

    const [departmentField] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": department_id,
        "call_center_departments.company_id": botField.company_id,
      });

    if (!departmentField) {
      throw new Error(`Department with ID ${department_id} does not exist`);
    }

    const {
      result: [contactField],
    } = await socialContactsRepository.getByField({
      "social_contacts.contact_id": phone,
      "social_contacts.network_id": botField.network_id,
    });
    if (!contactField) {
      throw new Error(`Contact with ID ${phone} does not exist`);
    }

    const existingDepartmentQueue =
      await repoCallCenter.getCallCenterQueueChatsByField({
        "call_center_queue_chats.department_id": department_id,
        "call_center_queue_chats.contact_id": contactField.uuid_unique,
        "call_center_queue_chats.bot_id": botID,
        "call_center_queue_chats.status": "PENDING",
      });

    if (!existingDepartmentQueue) {
      throw new Error(`Contact with ID ${phone} is not in queue`);
    }

    await repoCallCenter.updateCallCenterQueueChat(
      {
        "call_center_queue_chats.department_id": department_id,
        "call_center_queue_chats.contact_id": contactField.uuid_unique,
        "call_center_queue_chats.bot_id": botID,
        "call_center_queue_chats.status": "PENDING",
      },
      {
        "call_center_queue_chats.status": "CANCELED",
      }
    );
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

const getChatsByStatus = async (query) => {
  try {
    const { departmentID, status } = query;

    const { companyID, agentID } = await validateQueryParams(query);

    const queryObject = {
      ...(agentID && { "active_agent_sessions.agent_id": agentID }),
      "active_agent_sessions.company_id": companyID,
      "active_agent_sessions.department_id": departmentID,
    };

    const response = await repoCallCenter.getActiveAgentSessions(queryObject);

    return response
      .filter((session) => {
        return (
          (status === "ASSIGNED" &&
            (session.status === "ASSIGNED" ||
              session.status === "REASSIGNED")) ||
          (status === "IN_PROGRESS" && session.status === "IN_PROGRESS")
        );
      })
      .map((session) => {
        delete session.company_id;
        delete session.department_id;
        return session;
      });
  } catch (error) {
    throw new Error(error);
  }
};

const updateChatStatus = async (query, body) => {
  try {
    const { sessionID, user } = query;
    const { status, agentID, departmentID } = body;

    const [sessionField] =
      await repoCallCenter.getCallCenterSessionsLogsByField({
        "call_center_sessions_logs.uuid_unique": sessionID,
      });

    if (!sessionField) {
      throw new Error(`Session with ID ${sessionID} does not exist`);
    }

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    if (!accountField) {
      throw new Error(`User with ID ${user} does not exist`);
    }

    if (sessionField.asesor_id !== user) {
      throw new Error(`You are not allowed to update this session`);
    }

    const [chatField] = await repoCallCenter.getCallCenterQueueChatsByField({
      "call_center_queue_chats.session_id": sessionID,
    });

    if (!chatField) {
      throw new Error(`Chat with session ID ${sessionID} does not exist`);
    }

    let messageTemplate = sessionField.metadata ? sessionField.metadata : {};
    if (!messageTemplate.events) {
      messageTemplate.events = [];
    }
    return await handleStatusUpdate(
      sessionID,
      user,
      status,
      messageTemplate,
      agentID,
      departmentID,
      chatField.department_id
    );
  } catch (error) {
    throw new Error(error);
  }
};

const handleStatusUpdate = async (
  sessionID,
  user,
  status,
  messageTemplate,
  agentID = null,
  departmentID = null,
  oldDepartmentID = null
) => {
  if (status === "REASSIGNED") {
    const [existAgent] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": agentID,
    });

    if (!existAgent) {
      throw new Error(`Agent with ID ${agentID} does not exist`);
    }

    const [existAgentDepartment] =
      await repoCallCenter.getDepartmentAgentsByField({
        "call_center_departments_agents.agent_id": agentID,
        "call_center_departments_agents.department_id": departmentID,
      });

    if (!existAgentDepartment) {
      throw new Error(
        `Agent with ID ${agentID} is not in department ${departmentID}`
      );
    }

    const [agentAvailable] = await repoCallCenter.getAgentAvailability({
      "call_center_agents_availability.agent_id": agentID,
      "call_center_agents_availability.deparment_id": departmentID,
    });

    if (!agentAvailable?.isAvailable) {
      throw new Error(`Agent with ID ${agentID} is not available`);
    }

    messageTemplate.events.push(
      generateSessionEventLog("REASSIGNED", "Advisor", {
        from_agent: user,
        to_agent: agentID,
      })
    );

    await repoCallCenter.updateCallCenterSessionsLog(
      {
        "call_center_sessions_logs.uuid_unique": sessionID,
      },
      {
        "call_center_sessions_logs.asesor_id": agentID,
        "call_center_sessions_logs.metadata": JSON.stringify(messageTemplate),
      }
    );

    await repoCallCenter.updateCallCenterQueueChat(
      {
        "call_center_queue_chats.session_id": sessionID,
      },
      {
        "call_center_queue_chats.status": "REASSIGNED",
      }
    );

    return `Session ${sessionID} reassigned to agent ${agentID}`;
  } else if (status === "TRANSFERRED") {
    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });
    if (!accountField) {
      throw new Error(`User with ID ${user} does not exist`);
    }

    const { company_id } = accountField;

    const [existDepartment] =
      await repoCallCenter.getCallCenterDepartmentsByField({
        "call_center_departments.uuid_unique": departmentID,
        "call_center_departments.company_id": company_id,
      });

    if (!existDepartment) {
      throw new Error(`Department with ID ${departmentID} does not exist`);
    }

    messageTemplate.events.push(
      generateSessionEventLog("TRANSFERRED", "Advisor", {
        from_agent: user,
        from_department: oldDepartmentID,
        to_department: departmentID,
      })
    );

    await repoCallCenter.updateCallCenterQueueChat(
      {
        "call_center_queue_chats.session_id": sessionID,
      },
      {
        "call_center_queue_chats.status": status,
        "call_center_queue_chats.department_id": departmentID,
      }
    );

    await repoCallCenter.updateCallCenterSessionsLog(
      {
        "call_center_sessions_logs.uuid_unique": sessionID,
      },
      {
        "call_center_sessions_logs.metadata": JSON.stringify(messageTemplate),
      }
    );
    return `Session ${sessionID} transferred to department ${departmentID}`;
  } else {
    messageTemplate.events.push(
      generateSessionEventLog(status, "Advisor", {
        from_agent: user,
      })
    );

    await repoCallCenter.updateCallCenterQueueChat(
      {
        "call_center_queue_chats.session_id": sessionID,
      },
      {
        "call_center_queue_chats.status": status,
      }
    );

    const updateData = {
      "call_center_sessions_logs.metadata": JSON.stringify(messageTemplate),
    };

    if (status === "CLOSED") {
      updateData["call_center_sessions_logs.ended_at"] = dayjs().format();
    } else if (status === "IN_PROGRESS") {
      updateData["call_center_sessions_logs.started_at"] = dayjs().format();
    }

    await repoCallCenter.updateCallCenterSessionsLog(
      {
        "call_center_sessions_logs.uuid_unique": sessionID,
      },
      updateData
    );

    return `Session ${sessionID} status updated to ${status}`;
  }
};

const getClosedChats = async (query) => {
  try {
    const { departmentID, startDate, endDate } = query;

    const { companyID, agentID } = await validateQueryParams(query);

    const start = dayjs(startDate, "YYYY-MM-DD", true);
    const end = dayjs(endDate, "YYYY-MM-DD", true);

    if (start.isAfter(end)) {
      throw new Error("startDate cannot be after endDate");
    }

    const closedChats = await repoCallCenter.getClosedChats((builder) => {
      builder
        .where("closed_chats.company_id", companyID)
        .andWhere("closed_chats.status", "CLOSED")
        .andWhere("closed_chats.department_id", departmentID)
        .andWhereBetween("closed_chats.created_at", [
          start.format("YYYY-MM-DD"),
          end.add(1, "day").format("YYYY-MM-DD"),
        ]);

      if (agentID) {
        builder.andWhere("closed_chats.agent_id", agentID);
      }
    });

    return closedChats.map((chat) => {
      delete chat.department_id;
      return {
        ...chat,
      };
    });
  } catch (error) {
    throw new Error(error);
  }
};

const validateQueryParams = async (query) => {
  let { agentID, departmentID, user } = query;

  const [accountField] = await repoAccounts.getAccountByField({
    "accounts.uuid_unique": user,
  });

  if (!accountField) {
    throw new Error(`You're not authorized to access this resource`);
  }

  const { role_key, company_id: companyID } = accountField;

  if (role_key === "ADVISOR") {
    agentID = user;
  }

  if (["SUPERADMIN", "ADMIN", "MANAGER"].indexOf(role_key) === -1 && !agentID) {
    throw new Error(`You're not authorized to access this resource`);
  }

  const [departmentField] =
    await repoCallCenter.getCallCenterDepartmentsByField({
      "call_center_departments.uuid_unique": departmentID,
    });

  if (!departmentField) {
    throw new Error(`Department with ID ${departmentID} does not exist`);
  }

  if (agentID) {
    const [agentField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": agentID,
    });

    if (!agentField) {
      throw new Error(`Agent with ID ${agentID} does not exist`);
    }

    const [existAgentDepartment] =
      await repoCallCenter.getDepartmentAgentsByField({
        "call_center_departments_agents.agent_id": agentID,
        "call_center_departments_agents.department_id": departmentID,
      });

    if (!existAgentDepartment) {
      throw new Error(
        `Agent with ID ${agentID} is not in department ${departmentID}`
      );
    }
  }

  return { companyID, agentID };
};

module.exports = {
  getCallCenterCategoryList,
  saveCallCenterCategory,
  updateCallCenterCategory,
  deleteCallCenterCategory,
  getCallCenterDepartmentList,
  saveCallCenterDepartment,
  updateCallCenterDepartment,
  deleteCallCenterDepartment,
  getCallCenterDepartmentAgentList,
  saveCallCenterDepartmentAgent,
  updateCallCenterDepartmentAgent,
  deleteCallCenterDepartmentAgent,
  getCallCenterDepartmentScheduleList,
  saveCallCenterDepartmentSchedule,
  updateCallCenterDepartmentSchedule,
  deleteCallCenterDepartmentSchedule,
  getCallCenterDepartmentScheduleOffList,
  saveCallCenterDepartmentScheduleOff,
  updateCallCenterDepartmentScheduleOff,
  deleteCallCenterDepartmentScheduleOff,
  getCallCenterQuickResponseList,
  saveCallCenterQuickResponse,
  updateCallCenterQuickResponse,
  deleteCallCenterQuickResponse,
  sendCallCenterDepartments,
  saveDepartmentDerivationQueue,
  cancelDepartmentQueue,
  getChatsByStatus,
  updateChatStatus,
  getClosedChats,
};
