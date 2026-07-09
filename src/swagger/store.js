const responses = require("./responses");
const headers = require("./headers");

module.exports = {
  "/store/category": {
    get: {
      summary: "Get list of categories",
      tags: ["Store"],
      parameters: [
        {
          in: "query",
          name: "categoryID",
          schema: {
            type: "string",
          },
          description: "Category ID",
        },
        {
          in: "query",
          name: "parentID",
          schema: {
            type: "string",
          },
          description: "Parent ID of the category",
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create a new category",
      tags: ["Store"],
      parameters: [headers],
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
                  description: "Name of the category",
                  default: "Category 1",
                },
                parentID: {
                  type: "string",
                  description: "Parent ID of the category",
                  default: null,
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update a category",
      tags: ["Store"],
      parameters: [
        {
          name: "categoryID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "category ID",
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
                  description: "Name of the category",
                  default: "Category 1",
                },
                parentID: {
                  type: "string",
                  description: "Parent ID of the category",
                  default: null,
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete a category",
      tags: ["Store"],
      parameters: [
        {
          name: "categoryID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "category ID",
        },
        headers,
      ],
      responses,
    },
  },
  "/store/items": {
    get: {
      summary: "Get list of items",
      tags: ["Store"],
      parameters: [
        {
          in: "query",
          name: "itemID",
          schema: {
            type: "string",
          },
          description: "Item ID",
        },
        {
          in: "query",
          name: "categoryID",
          schema: {
            type: "string",
          },
          description: "Category ID",
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create a new item",
      tags: ["Store"],
      parameters: [headers],
      responses,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the item",
                  default: "Item 1",
                },
                description: {
                  type: "string",
                  description: "Description of the item",
                  default: "Description of item 1",
                },
                amount: {
                  type: "number",
                  description: "Amount of the item",
                  default: 100,
                },
                currencyID: {
                  type: "string",
                  description: "Currency ID",
                  default: "USD",
                },
                categoryID: {
                  type: "string",
                  description: "Category ID",
                  default: "categoryID",
                },
                typeID: {
                  type: "string",
                  description: "Type ID",
                  default: "typeID",
                },
                is_periodic: {
                  type: "boolean",
                  description: "Is periodic",
                  default: false,
                },
                images: {
                  type: "array",
                  description: "Array of images",
                  items: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update an item",
      tags: ["Store"],
      parameters: [
        {
          name: "itemID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "Item ID",
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the item",
                  default: "Item 1",
                },
                description: {
                  type: "string",
                  description: "Description of the item",
                  default: "Description of item 1",
                },
                amount: {
                  type: "number",
                  description: "Amount of the item",
                  default: 100,
                },
                currencyID: {
                  type: "string",
                  description: "Currency ID",
                  default: "USD",
                },
                categoryID: {
                  type: "string",
                  description: "Category ID",
                  default: "categoryID",
                },
                typeID: {
                  type: "string",
                  description: "Type ID",
                  default: "typeID",
                },
                is_periodic: {
                  type: "boolean",
                  description: "Is periodic",
                  default: false,
                },
                images: {
                  type: "array",
                  description: "Array of images",
                  items: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete an item",
      tags: ["Store"],
      parameters: [
        {
          name: "itemID",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "Item ID",
        },
        headers,
      ],
      responses,
    },
  },
  "/store/types": {
    get: {
      summary: "Get list of types",
      tags: ["Store"],
      parameters: [headers],
      responses,
    },
  },
  "/store/generate-url": {
    get: {
      summary: "Generate URL for an item",
      tags: ["Store"],
      parameters: [
        {
          in: "query",
          name: "itemID",
          required: true,
          schema: {
            type: "string",
          },
          description: "Item ID",
        },
        {
          in: "query",
          name: "botID",
          schema: {
            type: "string",
          },
          description: "ID of the bot to which the item is being purchased",
        },
        headers,
      ],
      responses,
    },
  },
  "/store/items/logs": {
    get: {
      summary: "Get list of logs",
      tags: ["Store"],
      parameters: [
        {
          in: "query",
          name: "itemID",
          schema: {
            type: "string",
          },
          description: "item ID",
        },
        {
          in: "query",
          name: "companyID",
          schema: {
            type: "string",
          },
          description: "Company ID",
        },
        {
          in: "query",
          name: "botID",
          schema: {
            type: "string",
          },
          description: "Bot ID",
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create a new log of an item",
      tags: ["Store"],
      parameters: [
        {
          in: "query",
          required: true,
          name: "itemID",
          schema: {
            type: "string",
          },
          description: "ID of the item",
        },
        {
          in: "query",
          name: "companyID",
          schema: {
            type: "string",
          },
          description: "ID of the company",
        },
        {
          in: "query",
          name: "botID",
          schema: {
            type: "string",
          },
          description: "ID of the bot",
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
                purchase_date: {
                  type: "string",
                  format: "date-time",
                  description: "Purchase date",
                },
                activation_date: {
                  type: "string",
                  format: "date-time",
                  description: "Activation date",
                  nullable: true,
                },
                renewal_date: {
                  type: "string",
                  format: "date-time",
                  description: "Renewal date",
                  nullable: true,
                },
                status: {
                  type: "boolean",
                  description: "Status",
                  default: true,
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update a log of an item",
      tags: ["Store"],
      parameters: [
        {
          in: "query",
          required: true,
          name: "itemID",
          schema: {
            type: "string",
          },
          description: "ID of the item",
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
                purchase_date: {
                  type: "string",
                  format: "date-time",
                  description: "Purchase date",
                },
                activation_date: {
                  type: "string",
                  format: "date-time",
                  description: "Activation date",
                  nullable: true,
                },
                renewal_date: {
                  type: "string",
                  format: "date-time",
                  description: "Renewal date",
                  nullable: true,
                },
                status: {
                  type: "boolean",
                  description: "Status",
                  default: true,
                },
              },
            },
          },
        },
      },
    },
  },
  "/store/logs/enum": {
    get: {
      summary: "Get list of logs enum",
      tags: ["Store"],
      parameters:[headers],
      responses,
    }
  }
};
