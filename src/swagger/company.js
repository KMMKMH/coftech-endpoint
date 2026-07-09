const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/company": {
    get: {
      summary: "Company list",
      tags: ["Company"],
      responses,
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
        headers,
      ],
    },
    post: {
      summary: "Company creation",
      tags: ["Company"],
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
                  description: "Name",
                  default: "coftech company",
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update company",
      tags: ["Company"],
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
                  description: "Name",
                  default: "coftech company",
                },
                status: {
                  type: "boolean",
                  description: "Company status",
                  default: true,
                },
                logo: {
                  type: "string",
                  description: "Company logo",
                  default: "",
                },
              },
            },
          },
        },
      },
    },
  },
  "/company/contacts": {
    get: {
      summary: "Company contacts list",
      tags: ["Company"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Company contact creation",
      tags: ["Company"],
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
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                phone: {
                  type: "string",
                  description: "Contact phone",
                  default: "+123456789",
                },
                name: {
                  type: "string",
                  description: "Contact name",
                  default: "coftech contact",
                },
              },
            },
          },
        },
      },
    },
  },
  "/company/config": {
    get: {
      summary: "Company configs list",
      tags: ["Company"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          description: "Company ID",
          schema: {
            type: "string",
          },
          required: true,
        },
        {
          name: "sn_providerID",
          in: "query",
          required: false,
          description: "Social Network Provider ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "ownerType",
          in: "query",
          description: "Owner type of Config",
          schema: {
            type: "string",
            enum: ["company", "extension", "agenda", "raffle", "provider"],
            description: "Owner type",
          },
          required: true,
        },
        {
          name: "botID",
          in: "query",
          description: "Bot ID",
          schema: {
            type: "string",
          },
          required: false,
        },
        headers,
      ],
      responses,
    },
    put: {
      summary: "Update company config",
      tags: ["Company"],
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
          name: "extensionID",
          in: "query",
          required: false,
          description: "Extension ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "sn_providerID",
          in: "query",
          required: false,
          description: "Social Network Provider ID",
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
                  description: "key",
                  default: "",
                },
                data: {
                  type: "string",
                  description: "data",
                  default: "",
                },
              },
            },
          },
        },
      },
    },
  },
};
