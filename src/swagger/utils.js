const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/utils/core/configs": {
    get: {
      summary: "Core Configs",
      tags: ["Utils"],
      parameters: [
        {
          name: "configKey",
          in: "query",
          required: false,
          description: "Config Key",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/utils/extensions": {
    get: {
      summary: "List extensions",
      tags: ["Utils"],
      parameters: [headers],
      responses,
    },
  },
  "/utils/token": {
    post: {
      summary: "Generate random token",
      tags: ["Utils"],
      parameters: [headers],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: {
                    type: "string",
                    description: "Allowed endpoint.",
                    example: "/example",
                  },
                  methods: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["GET", "POST", "PUT", "DELETE"],
                      description:
                        "HTTP methods allowed for this endpoint.",
                    },
                    example: ["GET", "POST"],
                  },
                },
                required: ["url", "methods"],
              },
            },
            example: [
              {
                url: "/example",
                methods: ["GET", "POST"],
              },
            ],
          },
        },
      },
      responses,
    },
    put: {
      summary: "Update token allowed endpoints",
      tags: ["Utils"],
      parameters: [
        {
          name: "token",
          in: "query",
          required: true,
          description: "Token to update",
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
                status: {
                  type: "boolean",
                  description: "Status",
                  example: true,
                },
                allowed_endpoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      url: {
                        type: "string",
                        description: "Allowed endpoint.",
                        example: "/example",
                      },
                      methods: {
                        type: "array",
                        items: {
                          type: "string",
                          enum: ["GET", "POST", "PUT", "DELETE"],
                          description:
                            "HTTP methods allowed for this endpoint.",
                        },
                        example: ["GET", "POST"],
                      },
                    },
                    required: ["url", "methods"],
                  },
                },
              },
            },
            example: {
              status: true,
              allowed_endpoints: [
                {
                  url: "/example",
                  methods: ["GET", "POST"],
                },
              ],
            },
          },
        },
      },
      responses,
    },
  },
  "/utils/ocr/image_to_text": {
    post: {
      summary: "Perform OCR",
      tags: ["Utils"],
      parameters: [headers],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                image: {
                  type: "string",
                  description: "Base 64 file",
                  example: "base64",
                },
              },
              required: ["image"],
            },
          },
        },
      },
      responses,
    },
  },
  "/utils/currencies": {
    get: {
      summary: "List of currencies",
      tags: ["Utils"],
      parameters: [
        {
          in: "query",
          name: "currencyID",
          schema: {
            type: "string",
          },
          description: "Currency ID",
        },
        headers,
      ],
      responses,
    },
  },
  "/utils/countries": {
    get: {
      summary: "List of countries",
      tags: ["Utils"],
      parameters: [
        {
          in: "query",
          name: "countryID",
          schema: {
            type: "string",
          },
          description: "Country ID",
        },
        headers,
      ],
      responses,
    },
  },
  "/utils/days/periods": {
    get: {
      summary: "List of days periods",
      tags: ["Utils"],
      parameters: [
        {
          in: "query",
          name: "languageCode",
          schema: {
            type: "string",
          },
          default: "en",
          description: "Language code",
        },
        headers,
      ],
      responses,
    },
  },
  "/utils/days/week": {
    get: {
      summary: "List of days of the week",
      tags: ["Utils"],
      parameters: [
        {
          in: "query",
          name: "languageCode",
          schema: {
            type: "string",
          },
          default: "en",
          description: "Language code",
        },
        headers,
      ],
      responses,
    },
  },
  "/utils/endpoints": {
    get: {
      summary: "Get endpoints list",
      tags: ["Utils"],
      parameters: [
        {
          name: "endpoint",
          in: "query",
          description: "Endpoint name",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/utils/embeddings/save": {
    post: {
      summary: "Generate Embeddings and Save to Pinecone",
      tags: ["Utils"],
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
          name: "fileID",
          in: "query",
          required: true,
          description: "File ID",
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
                text: {
                  type: "string",
                  description: "Text to generate embeddings",
                },
                chunknumber: {
                  type: "integer",
                  description: "Chunk number",
                },
                extraMetadata: {
                  type: "object",
                  description:
                    "Additional metadata from AWS. This can contain any key-value pairs.",
                  additionalProperties: true,
                  example: {
                    page: 5,
                  },
                },
              },
              required: ["text", "chunknumber"],
            },
          },
        },
      },
    },
  },
  "/utils/notification": {
    post: {
      summary: "Set a notification",
      tags: ["Utils"],
      parameters: [
        {
          name: "roomID",
          in: "query",
          required: true,
          description: "room ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "event",
          in: "query",
          required: true,
          description: "notification event",
          schema: {
            type: "string",
            enum: [
              "INFO",
              "WARNING",
              "ERROR",
              "SUCCESS",
              "CANCELLED",
              "CUSTOM",
            ],
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
                message: {
                  type: "string",
                  description: "Message to be sent to the client",
                },
              },
              required: ["message"],
            },
          },
        },
      },
    },
  },
  "/utils/openai/costs": {
    post: {
      summary: "Get OpenAI organization costs",
      tags: ["Utils"],
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
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                start_time: {
                  type: "integer",
                  default: 1743480000,
                  description:
                    "Start time in unix timestamp format (seconds since epoch) [required]",
                },
                end_time: {
                  type: "integer",
                  description:
                    "End time in unix timestamp format (seconds since epoch) [optional]",
                },
              },
              required: ["start_time"],
            },
          },
        },
      },
      responses,
    },
  },
  "/utils/action/types": {
    get: {
      summary: "List of action types for dashboard logs",
      tags: ["Utils"],
      parameters: [
        {
          in: "query",
          name: "languageCode",
          required: true,
          schema: {
            type: "string",
          },
          default: "en",
          description: "Language code",
        },
        headers,
      ],
      responses,
    },
  },
  "/utils/resource/types": {
    get: {
      summary: "List of resource types for dashboard logs",
      tags: ["Utils"],
      parameters: [
        {
          in: "query",
          name: "languageCode",
          schema: {
            type: "string",
          },
          default: "en",
          description: "Language code",
        },
        headers,
      ],
      responses,
    },
  },
};
