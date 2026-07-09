const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/storage": {
    get: {
      summary: "get storage list",
      tags: ["Storage"],
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
          name: "storageID",
          in: "query",
          required: false,
          allowEmptyValue: true,
          description: "storage ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create new Storage",
      tags: ["Storage"],
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
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                quota: {
                  type: "integer",
                  description: "quota storage of a company",
                  default: 100000,
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update Storage",
      tags: ["Storage"],
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
          name: "storageID",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "storage ID",
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
                quota: {
                  type: "integer",
                  description: "quota of a storage company",
                  default: 10000,
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete storage",
      tags: ["Storage"],
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
          name: "storageID",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "storage ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/storage/logs": {
    get: {
      summary: "get storage_logs list",
      tags: ["Storage"],
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
          name: "storageLogID",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "storage Log ID",
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
