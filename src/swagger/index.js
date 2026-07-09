const { nmiSchema, wooSchema } = require("./components/orders");
const loadModules = require("./loadModules");
const path = require("path");

const paths = loadModules(path.join(__dirname));

module.exports = {
  openapi: "3.0.0",
  info: {
    title: "Coftech Endpoint",
    version: "1.0.0",
    description: "Coftech Endpoint documentation",
    contact: {
      name: "Support team",
      email: "support@coftechservices.com",
      url: "https://coftechservices.com",
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        in: "header",
      },
    },
    schemas: {
      "NMI-Body-Type": {
        ...nmiSchema,
      },
      "Woo-Body-Type": {
        ...wooSchema,
      },
    },
  },
  tags: [
    {
      name: "Auth",
      description: "Authentications",
    },
    {
      name: "AWS",
      description: "AWS",
    },
    {
      name: "Accounts",
      description: "Accounts information",
    },
    {
      name: "BOTS",
      description: "BOTS",
    },
    {
      name: "Company",
      description: "Companies",
    },
    {
      name: "FileManager",
      description: "Upload a files",
    },
    {
      name: "NMI",
      description: "NMI",
    },
    {
      name: "Payments",
      description: "Payments",
    },
    {
      name: "Prompts",
      description: "Prompts for a Bot",
    },
    {
      name: "Social",
      description: "Social Networks",
    },
    {
      name: "Utils",
      description: "Utilities",
    },
    {
      name: "Short",
      description: "Short url",
    },
    {
      name: "Orders/Woo",
      description: "Purchase orders origin Woo",
    },
    {
      name: "Orders/NMI",
      description: "Purchase orders origin NMI",
    },
    {
      name: "Xetux",
      description: "Xetux integration",
    },
    {
      name: "Noco",
      description: "NocoDB integration",
    },
    {
      name: "Campaigns",
      description: "Social media campaigns",
    },
    {
      name: "Google",
      description: "Google API",
    },
    {
      name: "Raffle",
      description: "Raffle platform",
    },
    {
      name: "Store",
      description: "Store Management",
    },
    {
      name: "Agenda",
      description: "Agenda Management",
    },
    {
      name: "Bot Maker",
      description: "Bot Maker API",
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: { ...paths },
};
