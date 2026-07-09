const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/systemprompts": {
    get: {
      summary: "get system prompts",
      tags: ["SYSTEM PROMPTS"],
      parameters: [
        {
          name: "systemPromptID",
          in: "query",
          required: false,
          description: "System Prompt ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "New System Prompt",
      tags: ["SYSTEM PROMPTS"],
      parameters: [
        {
          name: "parentID",
          in: "query",
          required: false,
          description: "Parent ID",
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
                prompt: {
                  type: "string",
                  description: "Prompt",
                  default: "you are a bot",
                  required: true,
                },
                key: {
                  type: "string",
                  description: "key to identify the prompt",
                  default: "DEFAULT_PROMPT",
                  required: true,
                },
                name: {
                  type: "string",
                  description: "Name of the prompt",
                  default: "default prompt",
                  required: true,
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update System Prompt",
      tags: ["SYSTEM PROMPTS"],
      parameters: [
        {
          name: "systemPromptID",
          in: "query",
          required: true,
          description: "System Prompt ID",
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
                prompt_data: {
                  type: "string",
                  description: "Prompt",
                  default: "you are a bot",
                },
                name: {
                  type: "string",
                  description: "Name of the prompt",
                  default: "default prompt",
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete System Prompt",
      tags: ["SYSTEM PROMPTS"],
      parameters: [
        {
          name: "systemPromptID",
          in: "query",
          required: true,
          description: "System Prompt ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/systemprompts/backup": {
    get: {
      summary: "get system prompts",
      tags: ["SYSTEM PROMPTS"],
      parameters: [
        {
          name: "originalID",
          in: "query",
          required: false,
          description: "Original System Prompt ID",
          schema: {
            type: "integer",
          },
        },
        headers,
      ],
      responses,
    },
  },
};
