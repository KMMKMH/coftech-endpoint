const responses = require("./responses");
const headers = require("./headers");

module.exports = {
  "/google/auth": {
    get: {
      summary: "Google Auth Url",
      tags: ["Google"],
      responses,
      parameters: [
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
          name: "googleScopeID",
          in: "query",
          required: true,
          description: "Google Scope ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
  "/google/auth/revoke": {
    get: {
      summary: "Google Auth Revoke",
      tags: ["Google"],
      responses,
      parameters: [
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
    },
  },
  "/google/auth/state": {
    get: {
      summary: "Google Auth State",
      tags: ["Google"],
      responses,
      parameters: [
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
    },
  },
  "/google/scopes": {
    get: {
      summary: "Google Scopes",
      tags: ["Google"],
      responses,
      parameters: [
        {
          name: "serviceName",
          in: "query",
          required: false,
          description: "Service Name",
          schema: {
            type: "string",
            default: "GOOGLE_CALENDAR",
          },
        },
        headers,
      ],
    },
  },
};
