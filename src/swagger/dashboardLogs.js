const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/dashboardLogs": {
    get: {
      summary: "Dashboard Logs",
      tags: ["Dashboard Logs"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "botID",
          in: "query",
          required: false,
          description: "Bot ID to filter the logs",
          schema: {
            type: "string",
          },
        },
        {
          name: "action_type",
          in: "query",
          required: false,
          description: "Action type to filter the logs",
          schema: {
            type: "string",
          },
        },
        {
          name: "resource_type",
          in: "query",
          required: false,
          description: "Resource type to filter the logs",
          schema: {
            type: "string",
          },
        },
        {
          name: "startDate",
          in: "query",
          required: false,
          description: "Start date to filter logs (YYYY-MM-DD)",
          schema: {
            type: "string",
            format: "date",
            example: "2025-01-01"
          }
        },
        {
          name: "endDate",
          in: "query",
          required: false,
          description: "End date to filter logs (YYYY-MM-DD)",
          schema: {
            type: "string",
            format: "date",
            example: "2025-01-31"
          }
        },
        {
          name: "page",
          in: "query",
          required: false,
          description: "Page number for pagination",
          schema: {
            type: "integer",
            default: 1,
            minimum: 1,
          },
        },
        {
          name: "pageSize",
          in: "query",
          required: false,
          description: "Number of items per page",
          schema: {
            type: "integer",
            default: 10,
            minimum: 1,
          },
        },
        {
          name: "orderBy",
          in: "query",
          required: false,
          description: "Field to order by",
          schema: {
            type: "string",
            default: "created_at",
          },
        },
        {
          name: "orderDirection",
          in: "query",
          required: false,
          description: "Order direction (asc or desc)",
          schema: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
          },
        },
        headers,
      ],
      responses,
    },
  },
};
