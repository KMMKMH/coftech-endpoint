const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/accounts": {
    get: {
      summary: "Account list",
      tags: ["Accounts"],
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
          name: "userID",
          in: "query",
          required: false,
          allowEmptyValue: true,
          description: "User ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    put: {
      summary: "Update account",
      tags: ["Accounts"],
      parameters: [
        {
          name: "userID",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "User ID",
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
                first_name: {
                  type: "string",
                  description: "Name",
                },
                last_name: {
                  type: "string",
                  description: "Last name",
                },
                status: {
                  type: "boolean",
                  description: "Account status",
                  default: true,
                },
                email: {
                  type: "string",
                  description: "Email",
                },
                role_id: {
                  type: "string",
                  description: "Role ID",
                },
                phone: {
                  type: "string",
                  description: "Phone number",
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete account",
      tags: ["Accounts"],
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
          name: "userID",
          in: "query",
          required: false,
          allowEmptyValue: true,
          description: "User ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/accounts/cards": {
    get: {
      summary: "Get cards",
      tags: ["Accounts"],
      responses,
      parameters: [
        {
          name: "phoneNumber",
          in: "query",
          required: true,
          description: "phone Number",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
    post: {
      summary: "Save card",
      tags: ["Accounts"],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ccnumber: {
                  type: "string",
                  description:
                    "Credit card number must be between 13 and 19 digits.",
                  default: "0000000000000000",
                },
                ccexp: {
                  type: "string",
                  description: "Expiration date must be in MMYY format.",
                  default: "0000",
                },
                cvv: {
                  type: "string",
                  description: "CVV must be 3 or 4 digits.",
                  default: "000",
                },
                phone: {
                  type: "string",
                  description:
                    "phone number must be a valid international number.",
                  default: "+1234567890",
                },
                email: {
                  type: "string",
                  description: "Email",
                  default: "example@example.com",
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete card",
      tags: ["Accounts"],
      responses,
      parameters: [
        {
          name: "accountCardID",
          in: "query",
          required: true,
          description: "Account Card ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
};
