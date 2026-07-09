const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/webhooks/actions/discord": {
    post: {
      summary: "Discord Webhook",
      tags: ["Webhooks"],
      responses,
      parameters: [
        headers
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                channelID: {
                  type: "string",
                  description: "Channel Id",
                  default: "",
                },
                message: {
                  type: "string",
                  description: "content",
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