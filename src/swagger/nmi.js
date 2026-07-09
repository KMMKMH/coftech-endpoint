const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/nmi": {
    get: {
      summary: "Get Transactional Data",
      tags: ["NMI"],
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
          name: "customerVaultId",
          in: "query",
          required: false,
          allowEmptyValue: true,
          description: "Customer Vault ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "email",
          in: "query",
          required: false,
          allowEmptyValue: true,
          description: "Email",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/nmi/subscription": {
    get: {
      summary: "Get Plan Subscription",
      tags: ["NMI"],
      parameters: [
        {
          name: "customerVaultId",
          in: "query",
          required: false,
          description: "Customer Vault ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "phone",
          in: "query",
          required: false,
          description: "Phone number",
          schema: {
            type: "number",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create Plan Subscription",
      tags: ["NMI"],
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
          name: "customerVaultId",
          in: "query",
          required: true,
          allowEmptyValue: true,
          description: "Customer Vault ID",
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
                currency: {
                  type: "string",
                  default: "USD",
                  description: "Subscription currency",
                },
                plan_payments: {
                  type: "number",
                  default: 12,
                  description: "Total number of payments in the plan",
                },
                plan_amount: {
                  type: "number",
                  minimun: 0.1,
                  default: 8.0,
                  description: "Amount to charge in each billing cycle",
                },
                day_of_month: {
                  type: "number",
                  default: 12,
                  description: "Day of the month when the charge will be made",
                },
                day_frequency: {
                  type: "number",
                  default: 1,
                  description: "Charge every 30 days",
                },
                month_frequency: {
                  type: "number",
                  default: 1,
                  description:
                    "Alternative if you want to charge every certain number of months",
                },
              },
            },
          },
        },
      },
      responses,
    },
  },
  "/nmi/subscription/company": {
    get: {
      summary: "Get Plan Subscriptions",
      tags: ["NMI"],
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
        headers
      ],
      responses,
    },
  },
};
