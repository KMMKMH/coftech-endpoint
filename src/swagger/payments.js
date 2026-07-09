const responses = require("./responses");
const headers = require("./headers");

module.exports = {
  "/payments": {
    post: {
      summary: "Generate Payment Token",
      tags: ["Payments"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: false,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "botID",
          in: "query",
          required: false,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      headers,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                phone: {
                  type: "string",
                  default: "1234567890",
                },
                amount: {
                  type: "string",
                  default: "20.00",
                },
                currency: {
                  type: "string",
                  default: "USD",
                },
                transaction_type: {
                  type: "string",
                  default: "sale",
                },
              },
            },
          },
        },
      },
      responses,
    },
  },
  "/payments/process": {
    post: {
      summary: "Process Payment",
      tags: ["Payments"],
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
          name: "accountCardID",
          in: "query",
          required: false,
          description: "Account Card ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "phoneNumber",
          in: "query",
          required: false,
          description: "Phone Number",
          schema: {
            type: "string",
          },
        },
        {
          name: "providerID",
          in: "query",
          required: true,
          description: "Provider ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      headers,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                amount: {
                  type: "string",
                },
                orderId: {
                  type: "string",
                },
                transaction_type: {
                  type: "string",
                },
                currency: {
                  type: "string",
                },
              },
            },
          },
        },
      },
      responses,
    },
  },
  "/payments/providers": {
    get: {
      summary: "Get Providers",
      tags: ["Payments"],
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
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
      headers,
    },
  },
  "/payments/auth-code": {
    get: {
      summary: "Verify payment auth code",
      tags: ["Payments"],
      parameters: [
        {
          name: "code",
          in: "query",
          required: true,
          description: "Code",
          schema: {
            type: "string",
          },
        },
        {
          name: "phone",
          in: "query",
          required: true,
          description: "Phone Number",
          schema: {
            type: "number",
          },
        },
        {
          name: "accountCardID",
          in: "query",
          required: true,
          description: "Account Card ID",
          schema: {
            type: "string",
          },
        },{
          name: "secret",
          in: "query",
          required: true,
          description: "Secret",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
      headers,
    },
    post: {
      summary: "Send payment auth code",
      tags: ["Payments"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "Bot to send the code",
          schema: {
            type: "string",
          },
        },
        {
          name: "phone",
          in: "query",
          required: true,
          description: "Phone Number",
          schema: {
            type: "number",
          },
        },
        headers,
      ],
      responses,
      headers,
    },
  },
  "/payments/status": {
    get: {
      summary: "Get Payment Status",
      tags: ["Payments"],
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
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "referenceID",
          in: "query",
          required: true,
          description: "Reference ID",
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
