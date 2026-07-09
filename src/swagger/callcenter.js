const responses = require("./responses");
const headers = require("./headers");

module.exports = {
  "/callcenter/category": {
    get: {
      summary: "Get list of call center categories",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "callCategoryID",
          schema: {
            type: "string",
          },
          description: "ID of the call center category",
        },
        {
          in: "query",
          name: "callParentID",
          schema: {
            type: "string",
          },
          description: "Parent ID of the call center category",
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create a new call center category",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the call center category",
                  default: "Category 1",
                },
                keywords: {
                  type: "string",
                  description: "Keywords of the call center category",
                  default: null,
                  nullable: true,
                },
                callParentID: {
                  type: "string",
                  description: "Parent ID of the call center category",
                  default: null,
                  nullable: true,
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update a call center category",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          name: "callCategoryID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center category",
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the call center category",
                  default: "Category 1",
                },
                keywords: {
                  type: "string",
                  description: "Keywords of the call center category",
                  default: null,
                  nullable: true,
                },
                callParentID: {
                  type: "string",
                  description: "Parent ID of the call center category",
                  default: null,
                  nullable: true,
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete a call center category",
      tags: ["Call Center"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          name: "callCategoryID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center category",
        },
        headers,
      ],
      responses,
    },
  },
  "/callcenter/agents": {
    get: {
      summary: "Get list of call center agents",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "departmentID",
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        {
          in: "query",
          name: "userID",
          schema: {
            type: "string",
          },
          description: "ID of the call center agent",
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create a new call center agent",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        headers,
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                departmentID: {
                  type: "string",
                  description: "ID of the call center department",
                  default: "Department 1",
                },
                agentID: {
                  type: "string",
                  description: "ID of the call center agent",
                  default: "Agent 1",
                },
                stock: {
                  type: "number",
                  description: "Stock of the agent",
                  default: 1,
                },
              },
            },
          },
        },
      },
      responses,
    },
    put: {
      summary: "Update a call center agent",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                departmentID: {
                  type: "string",
                  description: "ID of the call center department",
                  default: "Department 1",
                },
                agentID: {
                  type: "string",
                  description: "ID of the call center agent",
                  default: "Agent 1",
                },
                stock: {
                  type: "number",
                  description: "Stock of the agent",
                  default: 1,
                },
                isPriority: {
                  type: "boolean",
                  description: "Priority of the agent",
                  default: false,
                },
              },
            },
          },
        },
      },
      responses,
    },
    delete: {
      summary: "Delete a call center agent",
      tags: ["Call Center"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "departmentID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        {
          name: "agentID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center agent",
        },
        headers,
      ],
      responses,
    },
  },
  "/callcenter/departments": {
    get: {
      summary: "Get list of call center departments",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "departmentID",
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        {
          in: "query",
          name: "callCategoryID",
          schema: {
            type: "string",
          },
          description: "ID of the call center category",
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create a new call center department",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the call center department",
                  default: "Department 1",
                },
                description: {
                  type: "string",
                  description: "Description of the call center department",
                  default: null,
                  nullable: true,
                },
                categoryID: {
                  type: "string",
                  description: "ID of the call center category",
                  default: "",
                },
                botID: {
                  type: "string",
                  description: "ID of the bot",
                  default: null,
                  nullable: true,
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update a call center department",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "departmentID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the call center department",
                  default: "Department 1",
                },
                description: {
                  type: "string",
                  description: "Description of the call center department",
                  default: null,
                  nullable: true,
                },
                categoryID: {
                  type: "string",
                  description: "ID of the call center category",
                  default: "",
                },
                botID: {
                  type: "string",
                  description: "ID of the bot",
                  default: null,
                  nullable: true,
                },
                status: {
                  type: "boolean",
                  description: "Status of the department",
                  default: true,
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete a call center department",
      tags: ["Call Center"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          name: "departmentID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        headers,
      ],
      responses,
    },
  },
  "/callcenter/department/schedule": {
    get: {
      summary: "Get list of call center department schedules",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "departmentID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        {
          in: "query",
          name: "scheduleID",
          schema: {
            type: "string",
          },
          description: "ID of the schedule",
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create a new call center department schedule",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "departmentID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                dayOfWeek: {
                  type: "string",
                  description: "Day of the week",
                  default: "Monday",
                },
                period: {
                  type: "string",
                  description: "Period of the shift",
                  default: "Morning",
                },
                startTime: {
                  type: "string",
                  description: "Start time of the shift",
                  default: "09:00",
                },
                endTime: {
                  type: "string",
                  description: "End time of the shift",
                  default: "17:00",
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update a call center department schedule",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "departmentID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        {
          in: "query",
          name: "scheduleID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the schedule",
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                dayOfWeek: {
                  type: "string",
                  description: "Day of the week",
                  default: "Monday",
                },
                period: {
                  type: "string",
                  description: "Period of the shift",
                  default: "Morning",
                },
                startTime: {
                  type: "string",
                  description: "Start time of the shift",
                  default: "09:00",
                },
                endTime: {
                  type: "string",
                  description: "End time of the shift",
                  default: "17:00",
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete a call center department schedule",
      tags: ["Call Center"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          name: "departmentID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        {
          name: "scheduleID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the schedule",
        },
        headers,
      ],
      responses,
    },
  },
  "/callcenter/department/schedule-off": {
    get: {
      summary: "Get list of call center department schedule offs",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "departmentID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        {
          in: "query",
          name: "scheduleOffID",
          schema: {
            type: "string",
          },
          description: "ID of the schedule off",
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create a new call center department schedule off",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "departmentID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  format: "date",
                  description: "Date of the schedule off",
                  default: "2023-01-01",
                },
                reason: {
                  type: "string",
                  description: "Reason for the schedule off",
                  default: null,
                  nullable: true,
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update a call center department schedule off",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "departmentID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the call center department",
        },
        {
          in: "query",
          name: "scheduleOffID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the schedule off",
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  format: "date",
                  description: "Date of the schedule off",
                  default: "2023-01-01",
                },
                reason: {
                  type: "string",
                  description: "Reason for the schedule off",
                  default: null,
                  nullable: true,
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete a call center department schedule off",
      tags: ["Call Center"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          name: "scheduleOffID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the schedule off",
        },
        headers,
      ],
      responses,
    },
  },
  "/callcenter/agents/quick-response": {
    get: {
      summary: "Get list of quick response of agent",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "agentID",
          schema: {
            type: "string",
          },
          description: "ID of the quick response agent",
        },
        {
          in: "query",
          name: "departmentID",
          schema: {
            type: "string",
          },
          description: "ID of the department",
        },
        {
          in: "query",
          name: "quickResponseID",
          schema: {
            type: "string",
          },
          description: "ID of the quick response",
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create a new quick response for an agent",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "agentID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the agent",
        },
        {
          in: "query",
          name: "departmentID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the department",
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                response: {
                  type: "string",
                  description: "Quick response",
                  default: "Agent 1",
                },
                title: {
                  type: "string",
                  description: "Title of the quick response",
                  default: null,
                  nullable: true,
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update a quick response of agent",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "companyID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "agentID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the quick response agent",
        },
        {
          in: "query",
          name: "quickResponseID",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the quick response",
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                response: {
                  type: "string",
                  description: "Quick response",
                  default: "Agent 1",
                },
                title: {
                  type: "string",
                  description: "Title of the quick response",
                  default: null,
                  nullable: true,
                },
                is_active: {
                  type: "boolean",
                  description: "Status of the quick response agent",
                  default: true,
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete a quick response of agent",
      tags: ["Call Center"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          name: "agentID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the quick response agent",
        },
        {
          name: "quickResponseID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the quick response",
        },
        headers,
      ],
      responses,
    },
  },
  "/callcenter/agents/chats/status": {
    get: {
      summary: "Get list of status chats of agent",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "agentID",
          schema: {
            type: "string",
          },
        },
        {
          in: "query",
          name: "departmentID",
          required: true,
          schema: {
            type: "string",
          },
        },
        {
          in: "query",
          name: "status",
          schema: {
            type: "string",
            enum: ["ASSIGNED", "IN_PROGRESS"],
            default: "ASSIGNED",
          },
        },
        headers,
      ],
      responses,
    },
    put: {
      summary: "Update chat status of agent",
      description:
        "Can be used to update the status of the chat or to transfer the chat to another department or agent",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "sessionID",
          required: true,
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  description: "Status of the chat",
                  default: "IN_PROGRESS",
                  enum: ["IN_PROGRESS", "CLOSED", "TRANSFERRED", "REASSIGNED"],
                },
                departmentID: {
                  type: "string",
                  description: "ID of the department",
                  default: null,
                  nullable: true,
                },
                agentID: {
                  type: "string",
                  description: "ID of the agent",
                  default: null,
                  nullable: true,
                },
              },
            },
            examples: {
              "Transfer chat to another department": {
                value: {
                  status: "TRANSFERRED",
                  departmentID: "XXX",
                },
              },
              "Reassign chat to another agent": {
                value: {
                  status: "REASSINGED",
                  agentID: "XXX",
                },
              },
              "Close chat": {
                value: {
                  status: "CLOSED",
                },
              },
              "In progress chat": {
                value: {
                  status: "IN_PROGRESS",
                },
              },
            },
          },
        },
      },
    },
  },
  "/callcenter/agents/chats/closed": {
    get: {
      summary: "Get list of closed chats of agent",
      tags: ["Call Center"],
      parameters: [
        {
          in: "query",
          name: "agentID",
          schema: {
            type: "string",
          },
        },
        {
          in: "query",
          name: "departmentID",
          required: true,
          schema: {
            type: "string",
          },
        },
        {
          in: "query",
          name: "startDate",
          required: true,
          schema: {
            type: "string",
            format: "date",
          },
          description: "YYYY-MM-DD Format",
        },
        {
          in: "query",
          name: "endDate",
          required: true,
          schema: {
            type: "string",
            format: "date",
          },
          description: "YYYY-MM-DD Format",
        },
        headers,
      ],
      responses,
    },
  },
};
