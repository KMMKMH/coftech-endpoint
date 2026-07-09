const headers = require("./headers");
const responses = require("./responses");
module.exports = {
  "/social/message": {
    post: {
      summary: "Save messages",
      tags: ["Social"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
            default: "efbc5705-9a76-4e70-a5f0-a9983125489c",
          },
        },
        {
          name: "networkID",
          in: "query",
          required: true,
          description: "network ID",
          schema: {
            type: "string",
            default: "d66eafe8-2613-4b47-b9a6-741ef1b3922e",
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
                is_group: {
                  type: "boolean",
                  description: "Belongs to one group",
                },
                is_broadcast: {
                  type: "boolean",
                  description: "The message is broadcast",
                },
                body: {
                  type: "string",
                  description: "Content main (Long Text)",
                  default: "default text",
                },
                data: {
                  type: "string",
                  description: "Meta data (Long Text)",
                },
                type: {
                  type: "string",
                  description: "Message Type",
                },
                sender: {
                  type: "string",
                  description: "ID sender",
                  default: "test@gmail.com",
                },
                via: {
                  type: "string",
                  description: "Message channel",
                  default: "receive",
                },
                to_send: {
                  type: "string",
                  description: "ID recipient",
                  default: "test@gmail.com",
                },
                author: {
                  type: "string",
                  description: "Message author",
                },
                extra1: {
                  type: "string",
                  description: "Additional fields (Long Text)",
                },
                extra2: {
                  type: "string",
                  description: "Additional fields (Long Text)",
                },
                extra3: {
                  type: "string",
                  description: "Additional fields (Long Text)",
                },
              },
            },
          },
        },
      },
    },
  },
  "/social/message/latest": {
    get: {
      summary: "Contacts messages list",
      tags: ["Social"],
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
          name: "networkID",
          in: "query",
          required: false,
          description: "Network ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "snProviderID",
          in: "query",
          required: false,
          description: "Social Network Provider ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/social/message/last-conversation": {
    get: {
      summary: "Get last messages from a conversation between two contacts",
      tags: ["Social"],
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
          name: "networkKey",
          in: "query",
          required: true,
          description: "Social Network Key",
          schema: {
            type: "string",
            default: "whatsapp",
          },
        },
        {
          name: "snProviderKey",
          in: "query",
          required: true,
          description: "Social Network Provider Key",
          schema: {
            type: "string",
          },
        },
        {
          name: "contact1",
          in: "query",
          required: true,
          description: "First contact ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "contact2",
          in: "query",
          required: true,
          description: "Second contact ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          description: "Number of messages to retrieve (1-20)",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 20,
            default: 5,
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/social/networks": {
    get: {
      summary: "Social networks list",
      tags: ["Social"],
      parameters: [
        {
          name: "networkKey",
          in: "query",
          required: false,
          description: "Network Key",
          schema: {
            type: "string",
          },
        },
        {
          name: "includeProviders",
          in: "query",
          required: false,
          description: "Include Providers",
          schema: {
            type: "boolean",
          },
        },
        {
          name: "networkID",
          in: "query",
          required: false,
          description: "Network ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
};
