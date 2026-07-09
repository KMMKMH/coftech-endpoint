const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/short": {
    post: {
      summary: "Short URL",
      tags: ["Short"],
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
        headers,
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Url to shorten",
                  default: "https://",
                },
                time: {
                  type: "number",
                  description: "Time before link expires",
                  default: 0,
                },
                attempts: {
                  type: "number",
                  description: "Available attempts",
                  default: 0,
                },
              },
            },
          },
        },
      },
      responses,
    },
    get: {
      summary: "Shorten link",
      tags: ["Short"],
      description: "Get short link",
      security: [],
      parameters: [
        {
          name: "key",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "The short url key",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/short/company": {
    get: {
      summary: "Shorten links for company",
      tags: ["Short"],
      description: "Get shorten links for company",
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
        headers,
      ],
      responses,
    },
  },
};
