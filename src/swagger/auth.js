const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/auth/login": {
    post: {
      summary: "Account verification",
      tags: ["Auth"],
      responses,
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  description: "E-mail",
                  default: "backend@coftechservices.com",
                },
                password: {
                  type: "string",
                  description: "Account password",
                  default: "********",
                },
              },
            },
          },
        },
      },
    },
  },
  "/auth/register": {
    post: {
      summary: "Account registration",
      tags: ["Auth"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: false,
          allowEmptyValue: true,
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
                account_id: {
                  type: "string",
                  description: "ID user",
                  default: "1",
                },
                email: {
                  type: "string",
                  description: "Email",
                  default: "support@coftechservices.com",
                },
                registered_at: {
                  type: "string",
                  description: "Registration date",
                  default: "2024-06-21 01:59:28",
                },
                first_name: {
                  type: "string",
                  description: "First name",
                  default: "John",
                },
                last_name: {
                  type: "string",
                  description: "last name",
                  default: "Doe",
                },
                phone: {
                  type: "string",
                  description: "Phone number",
                  default: "1234567890",
                },
                password: {
                  type: "string",
                  description: "Password",
                  default: "*********",
                },
                role_id: {
                  type: "string",
                  description: "Role ID",
                  default: "",
                },
              },
            },
          },
        },
      },
    },
  },
  "/auth/recovery/password": {
    post: {
      summary: "Account recovery password",
      tags: ["Auth"],
      responses,
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                value: {
                  type: "string",
                  description: "E-mail or phone",
                  default: "backend@coftechservices.com",
                },
                type: {
                  type: "string",
                  description: "email or phone",
                  default: "email",
                },
              },
            },
          },
        },
      },
    },
  },
  "/auth/verify/code": {
    post: {
      summary: "Account recovery password",
      tags: ["Auth"],
      responses,
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  description: "E-mail or Phone",
                  default: "email",
                },
                code: {
                  type: "string",
                  description: "Code",
                  default: "123456",
                },
                value: {
                  type: "string",
                  description: "E-mail or WhatsApp",
                  default: "backend@coftechservices.com",
                },
              },
            },
          },
        },
      },
    },
  },
  "/auth/save/password": {
    put: {
      summary: "Account recovery password",
      tags: ["Auth"],
      parameters: [headers],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                password: {
                  type: "string",
                  description: "Code",
                  default: "123456",
                  required: true,
                },
                email: {
                  type: "string",
                  description: "User Email",
                  required: false,
                },
              },
            },
          },
        },
      },
    },
  },
};
