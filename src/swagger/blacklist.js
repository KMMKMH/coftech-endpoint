const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/blacklist": {
    get: {
      summary: "Get blacklist numbers",
      tags: ["Blacklist"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "botID",
          in: "query",
          required: false,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "phone",
          in: "query",
          required: false,
          description: "Phone number",
          schema: {
            type: "string",
          },
        },
        {
          name: "type",
          in: "query",
          required: false,
          description: "Type of blacklist number",
          schema: {
            type: "enum",
            enum: ["BOT", "CLIENT"],
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Insert new phone number to blacklist",
      tags: ["Blacklist"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          allowEmptyValue: false,
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
                phone: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete phone number from blacklist",
      tags: ["Blacklist"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          allowEmptyValue: false,
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
                phone: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  },
};
