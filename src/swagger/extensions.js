const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/extensions": {
    get: {
      summary: "Extensions List",
      tags: ["Extensions"],
      parameters: [
        {
          name: "extensionID",
          in: "query",
          required: false,
          description: "extension ID",
          schema: {
            type: "string",
          },
        },

        headers,
      ],
      responses,
    },
    put: {
      summary: "Update extension",
      tags: ["Extensions"],
      parameters: [
        {
          name: "extensionID",
          in: "query",
          required: true,
          description: "Extension ID",
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
                name: {
                  type: "string",
                  description: "extension's name",
                  default: "",
                },
                status: {
                  type: "integer",
                  description: "extension's status",
                  default: 0,
                },
                icon: {
                  type: "string",
                  description: "extension's icon name",
                  default: "FaRobot",
                },
                category_id: {
                  type: "string",
                  description: "Category ID",
                  default: "",
                },
                description: {
                  type: "object",
                  properties: {
                    en: {
                      type: "string",
                      description: "English description",
                      default: "",
                    },
                    es: {
                      type: "string",
                      description: "Spanish description",
                      default: "",
                    },
                    zh: {
                      type: "string",
                      description: "Chinese description",
                      default: "",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/extensions/categories": {
    get: {
      summary: "Extension Categories List",
      tags: ["Extensions"],
      parameters: [
        {
          name: "categoryID",
          in: "query",
          description: "Category ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create Extension Category",
      tags: ["Extensions"],
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
                  description: "Category name",
                  default: "",
                },
                unique: {
                  type: "boolean",
                  description: "Is category unique?",
                  default: false,
                },
                dynamic: {
                  type: "boolean",
                  description: "Is category dynamic?",
                  default: false,
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update Extension Category",
      tags: ["Extensions"],
      parameters: [
        {
          name: "categoryID",
          in: "query",
          required: true,
          description: "Category ID",
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
                name: {
                  type: "string",
                  description: "Category name",
                  default: "",
                },
                unique: {
                  type: "boolean",
                  description: "Is category unique?",
                  default: false,
                },
                dynamic: {
                  type: "boolean",
                  description: "Is category dynamic?",
                  default: false,
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete Extension Category",
      tags: ["Extensions"],
      parameters: [
        {
          name: "categoryID",
          in: "query",
          required: true,
          description: "Category ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/extensions/configs": {
    put: {
      summary: "update config template",
      tags: ["Extensions"],
      parameters: [
        {
          name: "configTemplateID",
          in: "query",
          required: true,
          description: "config template ID",
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
                name: {
                  type: "string",
                  description: "config template's name",
                  default: "",
                },
                description: {
                  type: "string",
                  description: "config template's description",
                  default: 0,
                },
              },
            },
          },
        },
      },
    },
    get: {
      summary: "get extension configs",
      tags: ["Extensions"],
      parameters: [
        {
          name: "extensionID",
          in: "query",
          required: true,
          description: "Extension ID",
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
