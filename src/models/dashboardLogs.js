const logger = require("../utils/logger");
const { repoDashLogs } = require("../repositories/dashboardLogs");
const repoCompany = require("../repositories/company");
const repoAccount = require("../repositories/accounts");
const repoBots = require("../repositories/bots");
const { utilActionType, utilResourceType } = require("../utils/utilDashLogs");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");

const getActionLogs = async (query) => {
  const {
    companyID,
    botID,
    action_type,
    resource_type,
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
    orderBy = "created_at",
    orderDirection = "desc",
  } = query;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });

  if (!companyField) {
    throw ApiError(404, "Company not found", ErrorCodes.COMPANY_NOT_FOUND, {
      companyID,
    });
  }

  const filters = {
    "dashboard_logs.company_id": companyID,
  };

  if (botID) {
    filters["dashboard_logs.bot_id"] = { botID };
  }
  if (action_type) {
    filters["dashboard_logs.action_type"] = action_type;
  }
  if (resource_type) {
    filters["dashboard_logs.resource_type"] = resource_type;
  }

  if (startDate && endDate) {
    filters["dashboard_logs.created_at"] = { startDate, endDate };
  } else if (startDate) {
    filters["dashboard_logs.created_at"] = { startDate };
  } else if (endDate) {
    filters["dashboard_logs.created_at"] = { endDate };
  }

  const actionsLogs = await repoDashLogs.getByField(filters, {
    isRaw: false,
    page,
    limit: pageSize,
    orderBy,
    orderDirection,
  });

  const accountCache = new Map();
  const companyCache = new Map();

  const response = await Promise.all(
    actionsLogs.items.map(async (log) => {
      const { company_id, user_id } = log;

      if (!accountCache.has(user_id)) {
        const [accountField] = await repoAccount.getAccountByField({
          "accounts.uuid_unique": user_id,
        });
        accountCache.set(user_id, accountField);
      }

      const { first_name, last_name } = accountCache.get(user_id) || {};
      const fullName = `${first_name || ""} ${last_name || ""}`.trim();

      if (!companyCache.has(company_id)) {
        const [companyField] = await repoCompany.getCompanyByField({
          "company.uuid_unique": company_id,
        });
        companyCache.set(company_id, companyField);
      }

      const { name: companyName } = companyCache.get(company_id) || {};

      log.user_id = fullName;
      log.company_id = companyName;

      const message = generateLogMessage(log);
      delete log.id;

      return {
        ...log,
        message,
      };
    })
  );

  return {
    ...actionsLogs,
    items: response,
  };
};

const generateLogMessage = (log) => {
  const {
    user_id,
    action_type,
    resource_type,
    name,
    status,
    company_id,
    metadata,
  } = log;

  try {
    if (action_type === "error") {
      const { service, errorMessage, details } = metadata || {};
      const serviceInfo = service ? `in the ${service} service ` : "";
      const botInfo = name ? `for bot ${name} ` : "";
      const errorInfo = errorMessage ? `: ${errorMessage}` : "";
      const detailsInfo = details
        ? ` - Details: ${JSON.stringify(details)}`
        : "";
      return `An error occurred ${serviceInfo}${botInfo}${errorInfo}${detailsInfo}`.trim();
    }

    const user = user_id ? `User ${user_id}` : "Unknown User";
    const verb = action_type || "performed";
    const resource = resource_type
      ? `${resource_type}${name ? ` ${name}` : ""}`
      : "Unknown Resource";

    const outcome = status ? `${status}` : "";
    const details = metadata?.detail ? `Details: ${metadata.detail}` : "";
    const companyInfo = company_id ? ` ${"from"} ${company_id}` : "";

    return `${user} ${verb} ${resource} ${outcome}${companyInfo}${details}`;
  } catch {
    logger.info("Unknown");
    return "Unknown";
  }
};

const saveErrorLog = async (data) => {
  const { bot_id, service, errorMessage, details } = data;

  const [botField] = await repoBots.getBotsByField({
    "bots.uuid_unique": bot_id,
  });

  if (!botField) {
    logger.error(`Bot not found: ${bot_id}`);
    return false;
  }

  const { company_id, name } = botField;

  return await repoDashLogs.save({
    user_id: null,
    action_type: utilActionType.Error,
    resource_type: utilResourceType.Bot,
    company_id,
    name,
    status: "failure",
    metadata: {
      details,
      errorMessage,
      service,
    },
  });
};

module.exports = {
  getActionLogs,
  saveErrorLog,
};
