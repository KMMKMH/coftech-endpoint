const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/plans": {
    post: {
      summary: "Create a Plan",
      tags: ["Plans"],
      parameters: [headers],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                planName: {
                  type: "string",
                  minLength: 3,
                  maxLength: 25,
                },
                description: {
                  type: "string",
                  maxLength: 500,
                  nullable: true,
                },
                price: {
                  type: "number",
                  minimum: 0,
                  maximum: 99999999.99,
                  multipleOf: 0.01,
                },
                isActive: {
                  type: "boolean",
                  default: true,
                },
                currencyID: {
                  type: "string",
                  format: "uuid",
                },
              },
              required: ["planName", "price", "currencyID"],
              additionalProperties: false,
            },
          },
        },
      },
      responses,
    },
    get: {
      summary: "List Plans",
      tags: ["Plans"],
      parameters: [
        {
          name: "planName",
          in: "query",
          description: "Filter by plan name (min 3, max 25 characters)",
          required: false,
          schema: {
            type: "string",
            minLength: 3,
            maxLength: 25,
          },
        },
        {
          name: "isActive",
          in: "query",
          description: "Filter by active status",
          required: false,
          schema: {
            type: "boolean",
          },
        },
        {
          name: "currencyID",
          in: "query",
          description: "Filter by currency UUID",
          required: false,
          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],
      responses,
    },
    put: {
      summary: "Update a Plan",
      tags: ["Plans"],
      parameters: [
        {
          name: "planID",
          in: "query",
          required: true,
          description: "Plan ID",
          schema: {
            type: "string",
            format: "uuid",
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
                planName: {
                  type: "string",
                  minLength: 3,
                  maxLength: 25,
                },
                description: {
                  type: "string",
                  maxLength: 500,
                  nullable: true,
                },
                price: {
                  type: "number",
                  minimum: 0,
                  maximum: 99999999.99,
                  multipleOf: 0.01,
                },
                isActive: {
                  type: "boolean",
                },
                currencyID: {
                  type: "string",
                  format: "uuid",
                },
              },
              additionalProperties: false,
            },
          },
        },
      },
      responses,
    },
    delete: {
      summary: "Delete a Plan",
      tags: ["Plans"],
      parameters: [
        {
          name: "planID",
          in: "query",
          required: true,
          description: "Plan ID",
          schema: {
            type: "string",
            format: "uuid",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/plans/extensions": {
    get: {
      summary: "List Plan Extensions",
      tags: ["Plans"],
      parameters: [
        {
          name: "planID",
          in: "query",
          required: false,
          description: "Filter by plan ID",
          schema: {
            type: "string",
            format: "uuid",
          },
        },
        {
          name: "extensionID",
          in: "query",
          required: false,
          description: "Filter by extension ID",
          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],
      responses,
    },
    delete: {
      summary: "Delete a Plan Extension",
      tags: ["Plans"],
      parameters: [
        {
          name: "planID",
          in: "query",
          required: true,
          description: "Plan ID",
          schema: {
            type: "string",
            format: "uuid",
          },
        },
        {
          name: "extensionID",
          in: "query",
          required: true,
          description: "Extension ID",
          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],
      responses,
    },
    post: {
      summary: "Create a Plan Extension",
      tags: ["Plans"],
      parameters: [headers],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                planID: {
                  type: "string",
                  format: "uuid",
                },
                extensionID: {
                  type: "string",
                  format: "uuid",
                },
              },
              required: ["planID", "extensionID"],
              additionalProperties: false,
            },
          },
        },
      },
      responses,
    },
  },
};
