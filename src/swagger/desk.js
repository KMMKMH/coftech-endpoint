const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/desk/base": {
    get: {
      summary: "Get base's list by a companyID",
      tags: ["desk"],
      responses,
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
          name: "baseID",
          in: "query",
          description: "base ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
    post: {
      summary: "Create a desk base",
      tags: ["desk"],
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
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "base's name like a category",
                  default: "Menu coftech",
                },
              },
            },
          },
        },
      },
      responses,
    },
    put: {
      summary: "Update base's data",
      tags: ["desk"],
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
          name: "baseID",
          in: "query",
          required: true,
          description: "base ID",
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
                name: {
                  type: "string",
                  description: "base's name like a category",
                  default: "Menu gru",
                },
              },
            },
          },
        },
      },
      responses,
    },
    delete: {
      summary: "Delete a base",
      tags: ["desk"],
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
          name: "baseID",
          in: "query",
          required: true,
          description: "base ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/desk/table": {
    get: {
      summary: "Get table's list by a baseID",
      tags: ["desk"],
      responses,
      parameters: [
        {
          name: "baseID",
          in: "query",
          required: true,
          description: "base ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "tableID",
          in: "query",
          description: "table ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
    post: {
      summary: "Create table",
      tags: ["desk"],
      responses,
      parameters: [
        {
          name: "baseID",
          in: "query",
          required: true,
          description: "base ID",
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
                table_name: {
                  type: "string",
                  description: "Name of a table",
                  default: "Memberships",
                },
                columns: {
                  type: "array",
                  description: "List of columns with name and type",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "Name of the column",
                        default: "name",
                      },
                      type: {
                        type: "string",
                        default: "string",
                        description: "Data type of the column",
                        enum: ["string", "int", "float", "longtext"],
                      },
                    },
                    required: ["name", "type"],
                  },
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update table data",
      tags: ["desk"],
      parameters: [
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "Table ID",
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
                table_name: {
                  type: "string",
                  description: "Table Name",
                  default: "Coftech Company",
                },
              },
            },
          },
        },
      },
      responses,
    },
    delete: {
      summary: "Delete a table",
      tags: ["desk"],
      parameters: [
        {
          name: "baseID",
          in: "query",
          required: true,
          description: "base ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "table ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/desk/table/column": {
    get: {
      summary: "Get column by a tableID",
      tags: ["desk"],
      responses,
      parameters: [
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "table ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "columnID",
          in: "query",
          description: "column ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
    post: {
      summary: "Create column",
      tags: ["desk"],
      responses,
      parameters: [
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "table ID",
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
                name: {
                  type: "string",
                  required: true,
                  description: "Name of the column",
                  default: "name",
                },
                type: {
                  type: "string",
                  default: "string",
                  required: true,
                  description: "Data type of the column",
                  enum: ["string", "int", "float", "longtext"],
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update column",
      tags: ["desk"],
      parameters: [
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "Table ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "columnID",
          in: "query",
          required: true,
          description: "column ID",
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
                column_name: {
                  type: "string",
                  description: "a new column Name",
                  default: "banana",
                },
                column_type: {
                  type: "string",
                  description: "a type of column",
                  default: "longtext",
                },
              },
            },
          },
        },
      },
      responses,
    },
    delete: {
      summary: "Delete a column",
      tags: ["desk"],
      parameters: [
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "table ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "columnID",
          in: "query",
          required: true,
          description: "table ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/desk/table/data": {
    get: {
      summary: "Get data from a table using a tableID",
      tags: ["desk"],
      responses,
      parameters: [
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "table ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
    post: {
      summary: "Insert data into a table",
      tags: ["desk"],
      parameters: [
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "table ID",
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
              items: {
                type: "object",
                properties: {
                  columnID: {
                    type: "string",
                    description: "uuid of column in table",
                    default: "xxxx-xxxx-xxxx-xxxx",
                  },
                  data: {
                    type: "string",
                    description: "data to insert in column",
                    default: "Martin Martinez",
                  },
                },
                required: ["columnID", "data"],
              },
            },
          },
        },
      },
      responses,
    },
    put: {
      summary: "Update table data",
      tags: ["desk"],
      parameters: [
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "Table ID",
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
                rowID: {
                  type: "string",
                  description: "a uuid_unique of the row",
                  default: "7493d152-b887-478a-b37a-670fc66714ea",
                },
                columnID: {
                  type: "string",
                  description: "id of the column reference",
                  default: "7493d152-b887-478a-b37a-670fc66714ea",
                },
                data: {
                  type: "string",
                  description: "data to insert in column",
                  default: "Anthornio",
                },
              },
            },
          },
        },
      },
      responses,
    },
    delete: {
      summary: "Delete a row",
      tags: ["desk"],
      parameters: [
        {
          name: "tableID",
          in: "query",
          required: true,
          description: "table ID",
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
                rowID: {
                  type: "string",
                  description: "a uuid_unique of the row",
                  default: "7493d152-b887-478a-b37a-670fc66714ea",
                },
              },
            },
          },
        },
      },
      responses,
    },
  },
};
