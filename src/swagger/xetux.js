const responses = require("./responses");
const headers = require("./headers");
module.exports = {
  "/xetux/sales": {
    get: {
      summary: "Xetux sales",
      tags: ["Xetux"],
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
          name: "dateFrom",
          in: "query",
          required: false,
          description: "Date start",
          schema: {
            type: "string",
          },
        },
        {
          name: "dateEnd",
          in: "query",
          required: false,
          description: "Date end",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/xetux/purchases": {
    get: {
      summary: "Xetux purchases",
      tags: ["Xetux"],
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
          name: "date",
          in: "query",
          required: false,
          description: "Date for search",
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
