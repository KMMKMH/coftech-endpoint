const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/prompts": {
    get: {
      summary: "Prompts List",
      tags: ["Prompts"],
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
    },
    post: {
      summary: "Create a Prompt for bot",
      tags: ["Prompts"],
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
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name",
                  default: "Coftech Assistant",
                },
                data: {
                  type: "string",
                  description: "Data for instruction of bot",
                  default: "You're a Expert Assistant...",
                },
                type: {
                  type: "number",
                  description: "Bot prompt type",
                  default: 0,
                },
              },
            },
          },
        },
      },
      responses,
    },
    put: {
      summary: "Update Prompt",
      tags: ["Prompts"],
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
          name: "promptID",
          in: "query",
          required: true,
          description: "Prompt ID",
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
                  description: "Name",
                  default: "Coftech Assistant",
                },
                data: {
                  type: "string",
                  description: "Data for instruction of bot",
                  default: "You're a Expert Assistant...",
                },
                status: {
                  type: "boolean",
                  description: "Prompt Status",
                  default: true,
                },
              },
            },
          },
        },
      },
      responses,
    },
    delete: {
      summary: "Delete Prompt",
      tags: ["Prompts"],
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
          name: "promptID",
          in: "query",
          required: true,
          description: "prompt ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/prompts/assistance": {
    post: {
      summary: "Generate prompt assistant",
      tags: ["Prompts"],
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
        headers,
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                question: {
                  type: "string",
                  description:
                    "Question asked by the system (example: What type of bot do you want to create?)",
                  default: "What type of bot do you want to create?",
                },
                answer: {
                  type: "string",
                  description: "User response to the question",
                  default: "I want to create a bot for a pizzeria",
                },
                history: {
                  type: "array",
                  description:
                    "History of previous turns between the system and user",
                  items: {
                    type: "object",
                    properties: {
                      role: {
                        type: "string",
                        enum: ["assistant", "user"],
                        description: "Who sent the message",
                      },
                      content: {
                        type: "string",
                        description: "Message content",
                      },
                    },
                    required: ["role", "content"],
                  },
                  example: [
                    {
                      role: "assistant",
                      content: "What type of bot do you want to create?",
                    },
                    { role: "user", content: "I want one for my restaurant" },
                  ],
                },
                prompt_in_progress: {
                  type: "string",
                  description: "Prompt accumulated up to this step",
                  example:
                    "You are an assistant that helps create bots for restaurants...",
                },
              },
              required: ["question", "answer"],
            },
          },
        },
      },
      responses,
    },
  },
  "/prompts/test": {
    post: {
      summary: "Test prompt",
      tags: ["Prompts"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "bot ID",
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
                prompt: {
                  type: "string",
                  description: "Prompt to test",
                  default: "You're a Expert Assistant...",
                },
                data: {
                  type: "string",
                  description: "Message of the user to test the prompt",
                },
                history: {
                  type: "array",
                  description: "History of the conversation",
                  items: {
                    type: "object",
                    properties: {
                      role: {
                        type: "string",
                        description: "Role in the conversation",
                        enum: ["assistant", "user"],
                      },
                      content: {
                        type: "string",
                        description: "Message content",
                      },
                    },
                  },
                },
              },
              example: {
                prompt: "You're a Expert Assistant...",
                data: "Hello, what's my name?",
                history: [
                  {
                    role: "user",
                    content: "Hello, my name is John, John Doe",
                  },
                  {
                    role: "assistant",
                    content: "Hi, John Doe!",
                  },
                ],
              },
            },
          },
        },
      },
      responses,
    },
  },
  "/prompts/backups": {
    get: {
      summary: "Retrieve previously saved prompts",
      tags: ["Prompts"],
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
          description: "The ID of the bot",
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
