const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/bots": {
    get: {
      summary: "BOTS List",
      tags: ["BOTS"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: false,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "identifier",
          in: "query",
          required: false,
          description: "Identifier",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "New Bots",
      tags: ["BOTS"],
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
          name: "networkID",
          in: "query",
          required: true,
          description: "Network ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "planID",
          in: "query",
          required: true,
          description: "Plan ID",
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
                instanceID: {
                  type: "string",
                  description: "Instance ID",
                  default: "",
                  required: true,
                },
                bot_type: {
                  type: "string",
                  description: "Bot Type",
                  default: "0",
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update Bot",
      tags: ["BOTS"],
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
          required: true,
          description: "Bot ID",
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
                name: {
                  type: "string",
                  description: "Company ID",
                  default: "Coftech Agent",
                },
                description: {
                  type: "string",
                  description: "Description",
                  default: "BACoftech Agent is...",
                },
                photo: {
                  type: "string",
                  description: "Photo url",
                  default: "",
                },
              },
            },
          },
        },
      },
    },
  },
  "/bots/extensions": {
    get: {
      summary: "Extensions specific BOT",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "unassigned",
          in: "query",
          required: false,
          description:
            "Boolean flag to get only unassigned extensions (true or false)",
          schema: {
            type: "boolean",
            default: false,
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Save Extension a specific BOT",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "extensionID",
          in: "query",
          required: true,
          description: "extension ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    put: {
      summary: "Update Extension a specific BOT",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "extensionID",
          in: "query",
          required: true,
          description: "extension ID",
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
                status: {
                  type: "boolean",
                  description: "Status",
                  default: "true",
                },
              },
            },
          },
        },
      },
      responses,
    },
    delete: {
      summary: "Delete Extension a specific Bot",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "extensionID",
          in: "query",
          required: true,
          description: "extension ID",
          schema: {
            type: "string",
          },
        },
      ],
      responses,
    },
  },
  "/bots/configs": {
    get: {
      summary: "Get config for specific BOT",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "configID",
          in: "query",
          description: "Config uuid unique",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    put: {
      summary: "update config specific BOT",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "configID",
          in: "query",
          required: true,
          description: "config ID",
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
                data: {
                  type: "string",
                  description: "config data",
                  default: "",
                },
              },
            },
          },
        },
      },
      responses,
    },
  },
  "/bots/events/initialize": {
    post: {
      summary: "Bot Event Initialize",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/bots/events/cancelInitialization": {
    post: {
      summary: "Bot Event Cancel Initialization",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/bots/events/message": {
    post: {
      summary: "Send message",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "accountID",
          in: "query",
          required: false,
          description: "Account ID",
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
                message: {
                  type: "string",
                  description: "Message",
                  default: "ping pong",
                },
                phone: {
                  type: "string",
                  description: "Phone number",
                  default: "19183089434",
                },
                groupName: {
                  type: "string",
                  description: "Group name",
                  default: "",
                },
                isMedia: {
                  type: "boolean",
                  description: "Is media",
                  default: false,
                },
                media: {
                  type: "array",
                  description: "Array of media objects",
                  items: {
                    type: "object",
                    properties: {
                      base64: {
                        type: "string",
                        description: "Base64 encoded file",
                      },
                      mimeType: {
                        type: "string",
                        description: "Mime type of the file",
                      },
                      fileName: {
                        type: "string",
                        description: "Optional file name",
                      },
                      caption: {
                        type: "string",
                        description: "Optional caption for the media",
                      },
                    },
                    required: ["base64", "mimeType"],
                  },
                },
              },
            },
          },
        },
      },
      responses,
    },
  },
  "/bots/events/info": {
    get: {
      summary: "Bot info",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/bots/events/start": {
    post: {
      summary: "Start bot",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/bots/events/stop": {
    get: {
      summary: "Bot stop",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/bots/events/delete": {
    get: {
      summary: "Bot delete",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/bots/events/configs": {
    post: {
      summary: "Bot Config",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
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
                key: {
                  type: "string",
                  description: "key",
                  default: "",
                },
                data: {
                  type: "string",
                  description: "data",
                  default: "",
                },
              },
            },
          },
        },
      },
      responses,
    },
  },
  "/bots/events/restart": {
    post: {
      summary: "Restart bot",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/bots/events": {
    put: {
      summary: "Bot Event Update Identifier",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
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
                identifier: {
                  type: "string",
                  description: "identifier is a number",
                  default: "123456789",
                },
              },
            },
          },
        },
      },
      responses,
    },
  },
  "/bots/summary": {
    get: {
      summary: "Get bot summary",
      tags: ["BOTS"],
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
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "type",
          in: "query",
          required: true,
          description: "Summary retrieval type (DAILY, RANGE).",
          schema: {
            type: "string",
          },
          default: "DAILY",
        },
        {
          name: "from",
          in: "query",
          required: true,
          description: "Start date (Unix timestamp). Always required",
          schema: {
            type: "integer",
          },
          default: 1743480000,
        },
        {
          name: "to",
          in: "query",
          required: false,
          description: "End date (Unix timestamp). Required if type is RANGE",
          schema: {
            type: "integer",
          },
        },
        {
          name: "detailed",
          in: "query",
          required: false,
          description: "Detailed summary (include topics). Default false",
          schema: {
            type: "boolean",
            default: false,
          }
        },
        headers,
      ],
      responses,
    },
  },
  "/bots/tokens_usage": {
    get: {
      summary: "Bots tokens usage",
      tags: ["BOTS"],
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
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "fromDate",
          in: "query",
          required: true,
          description: "From date (unix timestamp)",
          schema: {
            type: "integer",
            default: 1746072000,
          },
        },
        {
          name: "toDate",
          in: "query",
          required: false,
          description: "To date (unix timestamp)",
          schema: {
            type: "integer",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/bots/social-network-activations": {
    get: {
      summary: "Get Bot Social Network Activations",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    put: {
      summary: "Update Bot Chat Status",
      tags: ["BOTS"],
      parameters: [
        {
          name: "networkID",
          in: "query",
          required: true,
          description: "network ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "providerID",
          in: "query",
          required: true,
          description: "Provider ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/bots/active-hours": {
    get: {
      summary: "Get Bot Active Hours Analytics",
      description:
        "Retrieves detailed analytics of bot active hours and activity metrics for a specified date range. This endpoint provides insights into when bots are most active, message volumes, and user engagement patterns. Requires elevated administrative privileges for system-wide monitoring and analytics purposes. Results are paginated for better performance.",
      tags: ["BOTS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot UUID to retrieve active hours data for",
          schema: {
            type: "string",
            format: "uuid",
          },
        },
        {
          name: "startDate",
          in: "query",
          required: true,
          description:
            "Start date in ISO 8601 format (YYYY-MM-DD). This is the beginning of the date range for the analytics query.",
          schema: {
            type: "string",
            format: "date",
          },
          example: "2025-01-01",
        },
        {
          name: "endDate",
          in: "query",
          required: false,
          description:
            "End date in ISO 8601 format (YYYY-MM-DD). Optional parameter to specify the end of the date range. If not provided, only the startDate will be used.",
          schema: {
            type: "string",
            format: "date",
          },
          example: "2025-01-31",
        },
        {
          name: "page",
          in: "query",
          required: false,
          description: "Page number for pagination (default: 1)",
          schema: {
            type: "integer",
            minimum: 1,
            default: 1,
          },
          example: 1,
        },
        {
          name: "pageSize",
          in: "query",
          required: false,
          description: "Number of records per page (default: 10, max: 100)",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
          example: 10,
        },
        headers,
      ],
      responses,
    },
  },
};
