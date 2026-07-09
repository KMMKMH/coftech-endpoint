const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/agenda/reserves": {
    get: {
      summary: "Get agenda reserves",
      tags: ["Agenda"],
      responses,
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
          name: "event_type_id",
          in: "query",
          required: false,
          description: "Event type ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "status_id",
          in: "query",
          required: false,
          description: "Status ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "date",
          in: "query",
          required: false,
          description: "Date",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
    post: {
      summary: "Create agenda reserve",
      tags: ["Agenda"],
      responses,
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
          required: false,
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
                },
                date: {
                  type: "date",
                  description: "Reservation date",
                  default: "2025-01-01 13:30:00",
                },
                event_type_id: {
                  type: "string",
                  description: "Event type id",
                },
                participants: {
                  type: "array",
                  description: "Participants account id",
                  default: ["accountID"],
                },
                phone_numbers: {
                  type: "array",
                  description: "Phone numbers",
                  default: ["+12345678901"],
                },
                public_notes: {
                  type: "string",
                  description: "Public notes",
                },
                private_notes: {
                  type: "string",
                  description: "Private notes",
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update agenda reserve",
      tags: ["Agenda"],
      responses,
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
          name: "agendaReserveID",
          in: "query",
          required: true,
          description: "Reserve ID",
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
                },
                date: {
                  type: "date",
                  description: "Reservation date",
                  default: "2025-01-01 13:30:00",
                },
                event_type_id: {
                  type: "string",
                  description: "Event type id",
                },
                participants: {
                  type: "array",
                  description: "Participants account id",
                  default: ["accountID"],
                },
                phone_numbers: {
                  type: "array",
                  description: "Phone numbers",
                  default: ["+12345678901"],
                },
                public_notes: {
                  type: "string",
                  description: "Public notes",
                },
                private_notes: {
                  type: "string",
                  description: "Private notes",
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete agenda reserve",
      tags: ["Agenda"],
      responses,
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
          name: "agendaReserveID",
          in: "query",
          required: true,
          description: "Reserve ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
  "/agenda/reserves/status": {
    get: {
      summary: "Get agenda reserves status",
      tags: ["Agenda"],
      responses,
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
    },
  },
  "/agenda/links": {
    get: {
      summary: "Get agenda links by company",
      tags: ["Agenda"],
      responses,
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
    },
    post: {
      summary: "Create agenda link",
      tags: ["Agenda"],
      responses,
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
          name: "reserveID",
          in: "query",
          required: true,
          description: "Reserve ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
    put: {
      summary: "Update agenda link",
      tags: ["Agenda"],
      responses,
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
          name: "linkID",
          in: "query",
          required: true,
          description: "Link ID",
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
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete agenda link",
      tags: ["Agenda"],
      responses,
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
          name: "linkID",
          in: "query",
          required: true,
          description: "Link ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
  "/agenda/links/details": {
    get: {
      summary: "Get agenda link details",
      tags: ["Agenda"],
      responses,
      parameters: [
        {
          name: "key",
          in: "query",
          required: true,
          description: "Link invitation from the reserve",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
  "/agenda/links/join": {
    get: {
      summary: "Join agenda reserve",
      tags: ["Agenda"],
      responses,
      parameters: [
        {
          name: "key",
          in: "query",
          required: true,
          description: "Link invitation from the reserve",
          schema: {
            type: "string",
          },
        },
        {
          name: "phone",
          in: "query",
          required: true,
          description: "Phone number to join the reserve",
          schema: {
            type: "string",
          },
          example: "+12345678901",
        },
        headers,
      ],
    },
  },
  "/agenda/event-types": {
    get: {
      summary: "Get agenda event types",
      tags: ["Agenda"],
      responses,
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
    },
    post: {
      summary: "Create agenda event type",
      tags: ["Agenda"],
      responses,
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
                },
                description: {
                  type: "string",
                  description: "Description",
                },
                duration: {
                  type: "number",
                  description: "Event duration",
                  default: 30,
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update agenda event type",
      tags: ["Agenda"],
      responses,
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
          name: "agendaEventTypeID",
          in: "query",
          required: true,
          description: "Event type ID",
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
                },
                description: {
                  type: "string",
                  description: "Description",
                },
                duration: {
                  type: "number",
                  description: "Event duration",
                  default: 60,
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete agenda event type",
      tags: ["Agenda"],
      responses,
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
          name: "agendaEventTypeID",
          in: "query",
          required: true,
          description: "Event type ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
  "/agenda/blocks": {
    get: {
      summary: "Get agenda blocked hours",
      tags: ["Agenda"],
      responses,
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
          name: "accountID",
          in: "query",
          required: false,
          description: "Account ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "permanent",
          in: "query",
          required: false,
          description: "Permanent",
          schema: {
            type: "boolean",
          },
        },
        headers,
      ],
    },
    post: {
      summary: "Create agenda blocked hours",
      tags: ["Agenda"],
      responses,
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
          name: "accountID",
          in: "query",
          required: false,
          description: "Account ID",
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
                is_global: {
                  type: "boolean",
                  description: "Is global",
                  default: false,
                },
                is_permanent: {
                  type: "boolean",
                  description: "Is permanent",
                  default: false,
                },
                start_time: {
                  type: "string",
                  description: "Start time",
                  default: "00:00",
                },
                end_time: {
                  type: "string",
                  description: "End time",
                  default: "23:59",
                },
                blocked_date: {
                  type: "string",
                  description: "Blocked date",
                  default: "2024-01-01",
                },
                blocked_days: {
                  type: "array",
                  description: "Blocked days",
                  default: [0, 6],
                },
                reason: {
                  type: "string",
                  description: "Reason",
                  default: "Weekend",
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update agenda blocked hours",
      tags: ["Agenda"],
      responses,
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
          name: "accountID",
          in: "query",
          required: false,
          description: "Account ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "agendaBlockedHoursID",
          in: "query",
          required: true,
          description: "Blocked ID",
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
                is_global: {
                  type: "boolean",
                  description: "Is global",
                  default: false,
                },
                is_permanent: {
                  type: "boolean",
                  description: "Is permanent",
                  default: false,
                },
                start_time: {
                  type: "string",
                  description: "Start time",
                  default: "00:00",
                },
                end_time: {
                  type: "string",
                  description: "End time",
                  default: "23:59",
                },
                blocked_date: {
                  type: "string",
                  description: "Blocked date",
                  default: "2024-01-01",
                },
                blocked_days: {
                  type: "array",
                  description: "Blocked days",
                  default: [0, 6],
                },
                reason: {
                  type: "string",
                  description: "Reason",
                  default: "Weekend",
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete agenda blocked hours",
      tags: ["Agenda"],
      responses,
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
          name: "agendaBlockedHoursID",
          in: "query",
          required: true,
          description: "Blocked ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
    },
  },
  "/agenda/logs": {
    get: {
      summary: "Get agenda logs",
      tags: ["Agenda"],
      responses,
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
          name: "agendaReserveID",
          in: "query",
          required: true,
          description: "Reserve ID",
          schema: {
            type: "string",
          }
        },
        headers,
      ],
    },
  },
};                