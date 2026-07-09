const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/noco/base/columns": {
    get: {
      summary: "Get table columns",
      tags: ["Noco"],
      responses,
      parameters: [
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "NocoDB Table ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
  "/noco/table": {
    post: {
      summary: "Insert table data",
      tags: ["Noco"],
      responses,
      parameters: [
        {
          name: "projectID",
          in: "query",
          required: true,
          description: "NocoDB Project ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "NocoDB Table ID",
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
              type: "array",
              description: "Array of JSON data",
              example: [
                {
                  table_column: "Value",
                  another_table_column: "Another value",
                },
                {
                  table_column: "Value 2",
                  another_table_column: "Another value 2",
                },
              ],
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete table data",
      tags: ["Noco"],
      responses,
      parameters: [
        {
          name: "projectID",
          in: "query",
          required: true,
          description: "NocoDB Project ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "NocoDB Table ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
  "/noco/base": {
    get: {
      summary: "Get base tables",
      tags: ["Noco"],
      responses,
      parameters: [
        {
          name: "projectID",
          in: "query",
          required: true,
          description: "NocoDB Project ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
};
