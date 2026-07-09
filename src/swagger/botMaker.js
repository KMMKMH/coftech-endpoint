const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/botmaker/channels": {
    get: {
      summary: "Get bot maker channels",
      tags: ["Bot Maker"],
      responses,
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
  "/botmaker/intents": {
    get: {
      summary: "Get bot maker intents",
      tags: ["Bot Maker"],
      responses,
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        {
          name: "idOrName",
          in: "query",
          description: "ID or name of the intent",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
  "/botmaker/variables": {
    get: {
      summary: "Get bot maker variables",
      tags: ["Bot Maker"],
      responses,
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        {
          name: "onlyTags",
          in: "query",
          description: "Get only tags",
          schema: {
            type: "boolean",
          },
        },
        headers,
      ],
    },
  },
  "/botmaker/trigger-intent": {
    post: {
      summary: "Trigger bot maker intent",
      tags: ["Bot Maker"],
      responses,
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
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
                channelId: {
                  type: "string",
                  description: "ID of the channel",
                  default: "",
                },
                contactId: {
                  type: "string",
                  description: "ID of the contact",
                  default: "",
                },
                intentIdOrName: {
                  type: "string",
                  description: "ID or name of the intent",
                  default: "",
                },
                variables: {
                  type: "object",
                  description: "Variables for the intent",
                  default: {},
                },
              },
            },
          },
        },
      },
    },
  },
  "/botmaker/whatsapp-templates": {
    get: {
      summary: "Get WhatsApp templates",
      tags: ["Bot Maker"],
      responses,
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
};
