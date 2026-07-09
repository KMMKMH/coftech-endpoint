const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/roles": {
    get: {
      summary: "get roles list",
      tags: ["Roles"],
      parameters: [
        {
          name: "roleID",
          in: "query",
          allowEmptyValue: false,
          description: "Role ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create new Roles",
      tags: ["Roles"],
      parameters: [headers],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                companyID: {
                  type: "string",
                  description: "a company uuid",
                  default: "xxxx-xxxx-xxxx-xxxx-xxxx",
                },
                name: {
                  type: "string",
                  description: "name of a role",
                  default: "invited",
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update Roles",
      tags: ["Roles"],
      parameters: [
        {
          name: "roleID",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "roles ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "company ID",
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
                  default: "guest",
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete roles",
      tags: ["Roles"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "roleID",
          in: "query",
          allowEmptyValue: true,
          description: "Role ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/roles/permissions": {
    get: {
      summary: "get roles list",
      tags: ["Roles"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "roleID",
          in: "query",
          required: true,
          description: "Role ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "add permissions to role",
      tags: ["Roles"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "roleID",
          in: "query",
          required: true,
          description: "Role ID",
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
                permissions: {
                  type: "array",
                  items: {
                    type: "string",
                    description: "keys of permissions",
                  },
                  example: [
                    "desk:table:get",
                    "user:profile:get",
                    "agendaReserves",
                  ],
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "update permissions to role",
      tags: ["Roles"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "roleID",
          in: "query",
          required: true,
          description: "Role ID",
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
                permissions: {
                  type: "array",
                  items: {
                    type: "string",
                    description: "keys of permissions",
                  },
                  example: ["desk:table:get", "user:profile:get"],
                },
              },
            },
          },
        },
      },
    },
  },
};
