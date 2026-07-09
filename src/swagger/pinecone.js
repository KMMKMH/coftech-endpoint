const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/pinecone/disabled-documents": {
    get: {
      summary: "Get Disabled Documents",
      tags: ["Pinecone"],
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
      summary: "Disable a Document",
      tags: ["Pinecone"],
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
          description: "File uuid unique to disable",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    delete: {
      summary: "Delete Disabled Document",
      tags: ["Pinecone"],
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
          name: "disabledFileID",
          in: "query",
          required: true,
          description: "Disabled file uuid unique to enable",
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
