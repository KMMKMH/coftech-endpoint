const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/aws/instances": {
    get: {
      summary: "Instances List",
      tags: ["AWS"],
      parameters: [
        {
          name: "instanceName",
          in: "query",
          required: false,
          description: "Instance Name",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create instance",
      tags: ["AWS"],
      parameters: [
        {
          name: "bundleId",
          in: "query",
          required: true,
          description: "bundleId",
          default: "medium_3_0",
          schema: {
            type: "string",
          },
        },
        {
          name: "companyID",
          in: "query",
          required: false,
          description: "Company ID for tagging the instance",
          schema: {
            type: "string",
            format: "uuid",
          },
        },
        headers,
      ],
      responses,
    },
    delete: {
      summary: "Delete instance",
      tags: ["AWS"],
      parameters: [
        {
          name: "instanceName",
          in: "query",
          required: false,
          description: "Instance Name",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/aws/instances/bots": {
    get: {
      summary: "Bots per Instances",
      tags: ["AWS"],
      parameters: [
        {
          name: "instanceID",
          in: "query",
          required: false,
          description: "Instance ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "botID",
          in: "query",
          required: false,
          description: "BOT ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "instanceName",
          in: "query",
          required: false,
          description: "Instance Name",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    put: {
      summary: "Update Bot Instance",
      tags: ["AWS"],
      parameters: [
        {
          name: "botID",
          in: "query",
          required: true,
          description: "BOT ID",
          schema: {
            type: "string",
            format: "uuid",
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
                instanceID: {
                  type: "string",
                  format: "uuid",
                  description: "Instance ID",
                },
              },
              required: ["instanceID"],
            },
          },
        },
      },
      responses,
    },
  },
  "/aws/instances/ports": {
    put: {
      summary: "Set ports",
      tags: ["AWS"],
      parameters: [
        {
          name: "instanceID",
          in: "query",
          required: true,
          description: "InstanceID",
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
                ports: {
                  type: "array",
                  description: "Ports",
                  default: [
                    {
                      fromPort: 80,
                      toPort: 80,
                      protocol: "tcp",
                    },
                    {
                      fromPort: 443,
                      toPort: 443,
                      protocol: "tcp",
                    },
                    {
                      fromPort: 22,
                      toPort: 22,
                      protocol: "tcp",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
  "/aws/instances/ready": {
    post: {
      summary: "Instance Ready",
      tags: ["AWS"],
      parameters: [headers],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                instanceName: {
                  type: "string",
                  description: "Instance Name",
                },
              },
            },
          },
        },
      },
      responses,
    },
  },
  "/aws/instances/restart": {
    post: {
      summary: "Instance Restart",
      tags: ["AWS"],
      parameters: [
        {
          name: "instanceID",
          in: "query",
          required: true,
          description: "Instance ID",
          schema: {
            type: "string",
            format: "uuid",
          },
        },
        headers,
      ],
      responses,
    },
  },
};
