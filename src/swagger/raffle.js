const responses = require("./responses");
const headers = require("./headers");

module.exports = {
  "/raffle/auth/verification": {
    post: {
      summary: "Register user in Raffle",
      tags: ["Raffle"],
      security: [],
      responses,
      parameters: [
        {
          name: "botID",
          in: "query",
          description: "ID of the bot making the request",
          schema: {
            type: "string",
          },
        },
        {
          name: "companyID",
          in: "query",
          description: "ID of the company",
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
                phone: {
                  type: "string",
                  description: "Phone number must be without '+'",
                  default: "51484545545",
                },
                channelId: {
                  type: "string",
                  description: "ID of the channel",
                  default: "",
                },
                contactId: {
                  type: "string",
                  description: "ID of the contact",
                  default: "",
                },
                items: {
                  type: "array",
                  description: "Array of items",
                  items: {
                    type: "object",
                    properties: {
                      intentIdOrName: {
                        type: "string",
                        required: true,
                        description: "ID or name of the intent",
                        default: "",
                      },
                      variables: {
                        type: "object",
                        description: "Variables for the intent",
                        default: {},
                      },
                    },
                  },
                },
              },
            },
            examples: {
              "Bot Maker Body": {
                value: {
                  channelId: "grupo-example-223",
                  contactId: "54346789722",
                  items: [
                    {
                      intentIdOrName: "intent-example",
                      variables: {
                        code: "Your verification code is...",
                      },
                    },
                  ],
                },
              },
              "CoftechBot Body": {
                value: {
                  phone: "514845455433",
                },
              },
            },
          },
        },
      },
    },
  },
  "/raffle/auth/verify-code": {
    post: {
      summary: "Verify user with verification code",
      tags: ["Raffle"],
      security: [],
      parameters: [headers],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "Verification code sent to the user",
                  default: "1234",
                },
                phone: {
                  type: "string",
                  description: "Phone number of the user in E.164 format",
                  default: "123456789",
                },
              },
            },
          },
        },
      },
    },
  },

  "/raffle/user": {
    put: {
      summary: "Update user information",
      tags: ["Raffle"],
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
          name: "key",
          in: "query",
          required: true,
          description: "key of a log",
          schema: {
            type: "string",
          },
        },
        {
          name: "phone",
          in: "query",
          description: "Phone number of the participant",
          schema: {
            type: "number",
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
                fullname: {
                  type: "string",
                  description: "fullname of the user",
                  default: "Robot Rosales",
                },
                email: {
                  type: "string",
                  description: "email of the user",
                  default: "support@coftechservices.com",
                },
              },
            },
          },
        },
      },
    },
    get: {
      summary: "Get users",
      tags: ["Raffle"],
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
          name: "key",
          in: "query",
          required: true,
          description: "key of a log",
          schema: {
            type: "string",
          },
        },
        {
          name: "phone",
          in: "query",
          description: "Phone number of the participant",
          schema: {
            type: "number",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/raffle/verify/invoice": {
    post: {
      summary: "Verify invoice with base64 data",
      tags: ["Raffle"],
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
          name: "botID",
          in: "query",
          required: true,
          description: "bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "phone",
          in: "query",
          required: true,
          description: "Phone number of the participant",
          schema: {
            type: "number",
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
                invoice: {
                  type: "string",
                  description: "Base64 encoded invoice data",
                  default: "dGhpcyBpcyBhIHNhbXBsZSBpbmZvcm1hdGlvbg==",
                },
              },
            },
          },
        },
      },
    },
  },
  "/raffle/company/configs": {
    get: {
      summary: "Get company configurations",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Send company configurations",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
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
                key: {
                  type: "string",
                  description: "Configuration key",
                  default: "configKey",
                },
                data: {
                  type: "string",
                  description: "Configuration data",
                  default: "configData",
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update company configurations",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
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
                key: {
                  type: "string",
                  description: "Configuration key",
                  default: "configKey",
                },
                data: {
                  type: "string",
                  description: "Configuration data",
                  default: "configData",
                },
              },
            },
          },
        },
      },
    },
  },
  "/raffle/company/initial-configs": {
    post: {
      summary: "Send initial company configurations",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/raffle/lottery": {
    get: {
      summary: "get data of a raffle lottery",
      tags: ["Raffle"],
      responses,
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        {
          name: "lotteryID",
          in: "query",
          description: "lottery ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
    post: {
      summary: "create a raffle lottery",
      tags: ["Raffle"],
      responses,
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
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
                  description: "name of a lottery",
                  default: "lottery",
                },
                description: {
                  type: "string",
                  description: "description of a lottery",
                  default: "a common lottery",
                },
                lottery_type_ID: {
                  type: "string",
                  description: "a uuid lottery type",
                  default: "xxxxx-xxxxx-xxx-xxxx",
                },
                start_date: {
                  type: "string",
                  description: "start date of a lottery",
                  default: "2024-11-19T05:38:50.866",
                },
                end_date: {
                  type: "string",
                  description: "end date of a lottery",
                  default: "2024-11-19T05:38:50.866",
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update lottery",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        {
          name: "lotteryID",
          in: "query",
          required: true,
          description: "lottery ID",
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
                key: {
                  type: "string",
                  description: "Lottery field key",
                  default: "description",
                },
                data: {
                  type: "string",
                  description: "Lottery field data",
                  default: "a mega lottery",
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete a raffle lottery",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        {
          name: "lotteryID",
          in: "query",
          required: true,
          description: "lottery ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/raffle/invoices": {
    get: {
      summary: "Get invoices",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        {
          name: "phone",
          in: "query",
          description: "Phone number of the participant",
          schema: {
            type: "number",
          },
        },
        {
          name: "invoiceID",
          in: "query",
          description: "ID of the invoice",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    put: {
      summary: "Update invoice of a user",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        {
          name: "invoiceID",
          in: "query",
          required: true,
          description: "ID of the invoice",
          schema: {
            type: "string",
          },
        },
        {
          name: "phone",
          in: "query",
          required: true,
          description: "Phone number of the participant",
          schema: {
            type: "number",
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
                reference: {
                  type: "string",
                  description: "Reference of the invoice",
                  default: "RTF-454546",
                },
                points: {
                  type: "number",
                  description: "Points of the invoice",
                  default: 0,
                },
              },
            },
          },
        },
      },
    },
  },
  "/raffle/lottery/configs": {
    get: {
      summary: "Get lottery configurations",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        {
          name: "lotteryID",
          in: "query",
          required: true,
          description: "lottery ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "create lottery configurations",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        {
          name: "lotteryID",
          in: "query",
          required: true,
          description: "lottery ID",
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
                key: {
                  type: "string",
                  description: "Configuration key",
                  default: "WINNERS_NUMBER",
                },
                data: {
                  type: "string",
                  description: "Configuration data",
                  default: "2",
                },
                description: {
                  type: "string",
                  description: "Configuration description",
                  default: "number of winner",
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update lottery configurations",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        {
          name: "lotteryID",
          in: "query",
          required: true,
          description: "lottery ID",
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
                key: {
                  type: "string",
                  description: "Configuration key",
                  default: "WINNERS_NUMBER",
                },
                data: {
                  type: "string",
                  description: "Configuration data",
                  default: "4",
                },
                description: {
                  type: "string",
                  description: "Configuration description",
                  default: "number of winner",
                },
              },
            },
          },
        },
      },
    },
  },
  "/raffle/roles": {
    get: {
      summary: "Get raffle roles",
      tags: ["Raffle"],
      parameters: [headers],
      responses,
    },
    put: {
      summary: "Update raffle role",
      tags: ["Raffle"],
      parameters: [
        {
          name: "rolID",
          in: "query",
          required: true,
          description: "ID of the role",
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
                key: {
                  type: "string",
                  description: "key of role field",
                  default: "name",
                },
                data: {
                  type: "string",
                  description: "Data to insert in role field",
                  default: "Admin2",
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: "create a raffle role",
      tags: ["Raffle"],
      responses,
      parameters: [headers],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                key: {
                  type: "string",
                  description: "key of role field",
                  default: "STAFF",
                },
                name: {
                  type: "string",
                  description: "Data to insert in role field",
                  default: "Staff",
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete a raffle role",
      tags: ["Raffle"],
      parameters: [
        {
          name: "roleID",
          in: "query",
          required: true,
          description: "role ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/raffle/user/roles": {
    get: {
      summary: "Get users roles",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
          schema: {
            type: "string",
          },
        },
        {
          name: "userID",
          in: "query",
          description: "user ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    put: {
      summary: "Update raffle user rolee",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          description: "ID of the company",
          required: true,
          schema: {
            type: "string",
          },
        },
        {
          name: "userID",
          in: "query",
          required: true,
          description: "ID of the raffle user",
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
                role_id: {
                  type: "string",
                  description: "role ID",
                  default: "xxxxx-xxx-xxxxxx-xxxx",
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: "Add role to raffle user",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          description: "ID of the company",
          required: true,
          schema: {
            type: "string",
          },
        },
        {
          name: "userID",
          in: "query",
          required: true,
          description: "ID of the raffle user",
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
                roleID: {
                  type: "string",
                  description: "ID of the raffle user rolee",
                  default: "xxxxx-xxx-xxxxx-xxxx",
                },
              },
            },
          },
        },
      },
      responses,
    },
    delete: {
      summary: "Delete a raffle user role",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          description: "ID of the company",
          required: true,
          schema: {
            type: "string",
          },
        },
        {
          name: "userID",
          in: "query",
          required: true,
          description: "ID of the raffle user",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/raffle/lottery/winner": {
    get: {
      summary: "Get lottery winner",
      tags: ["Raffle"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "ID of the company",
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
