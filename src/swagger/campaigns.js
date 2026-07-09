const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/campaigns": {
    get: {
      summary: "List campaigns",
      tags: ["Campaigns"],
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
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create campaign",
      tags: ["Campaigns"],
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
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "type", "cron", "source"],
              properties: {
                name: {
                  type: "string",
                  description: "Campaign name",
                  default: "Example Campaign",
                },
                type: {
                  type: "string",
                  description: "Type",
                  enum: ["UNIQUE", "RECURRENT"],
                  default: "RECURRENT",
                },
                cron: {
                  type: "string",
                  description: "Cron expression",
                  default: "30 * * * *",
                },
                source: {
                  type: "string",
                  description: "Source key",
                  default: "BOT",
                },
                message: {
                  type: "string",
                  description: "Message to send",
                  default: "Hello {{NAME}}!",
                },
                media: {
                  type: "string",
                  description: "Media Base64",
                  default: "Base64",
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update campaign",
      tags: ["Campaigns"],
      parameters: [
        {
          name: "campaignID",
          in: "query",
          required: true,
          description: "Campaign ID",
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
              required: ["name", "type", "cron", "source"],
              properties: {
                name: {
                  type: "string",
                  description: "Campaign name",
                  default: "Example Campaign",
                },
                type: {
                  type: "string",
                  description: "Type",
                  enum: ["UNIQUE", "RECURRENT"],
                  default: "RECURRENT",
                },
                cron: {
                  type: "string",
                  description: "Cron expression",
                  default: "30 * * * *",
                },
                source: {
                  type: "string",
                  description: "Source key",
                  default: "BOT",
                },
                message: {
                  type: "string",
                  description: "Message to send",
                  default: "Hello {{NAME}}!",
                },
                media: {
                  type: "string",
                  description: "Media Base64",
                  default: "Base64",
                },
              },
            },
          },
        },
      },
    },
  },
  "/campaigns/configs": {
    put: {
      summary: "Update campaign configs",
      tags: ["Campaigns"],
      parameters: [
        {
          name: "campaignID",
          in: "query",
          required: true,
          description: "Campaign ID",
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
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: {
                    type: "string",
                    description: "Config key.",
                  },
                  data: {
                    type: "string",
                    description: "Configuration value associated with the key",
                  },
                },
                required: ["key", "data"],
              },
            },
            example: [
              {
                key: "CONFIG_KEY",
                data: "VALUE",
              },
            ],
          },
        },
      },
    },
  },
  "/campaigns/continue": {
    post: {
      summary: "Continue stopped campaign",
      tags: ["Campaigns"],
      parameters: [
        {
          name: "campaignID",
          in: "query",
          required: true,
          description: "Campaign ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/campaigns/stop": {
    post: {
      summary: "Stop in progress campaign",
      tags: ["Campaigns"],
      parameters: [
        {
          name: "campaignID",
          in: "query",
          required: true,
          description: "Campaign ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/campaigns/test": {
    post: {
      summary: "Test campaign",
      tags: ["Campaigns"],
      parameters: [
        {
          name: "campaignID",
          in: "query",
          required: true,
          description: "Campaign ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "phone",
          in: "query",
          required: true,
          description: "Phone Number",
          schema: {
            type: "number",
          },
        },
        headers,
      ],
      responses,
    },
  },
};
