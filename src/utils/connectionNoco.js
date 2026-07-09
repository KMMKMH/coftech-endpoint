const https = require("https");

const { Api } = require("nocodb-sdk");

let nocoApi;

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const InitializeNocoApi = (token) => {
  try {
    nocoApi = new Api({
      baseURL: process.env.NOCODB_URL,  
      headers: token ? { "xc-token": token } : {},
      format: "json",
      httpsAgent: agent,
    });
  } catch (error) {
    console.error("Error setting up NocoDB API:", error);
    throw new Error(error);
  }
};

const getApi = (token) => {
  if (!nocoApi || token) {
    token ? InitializeNocoApi(token) : InitializeNocoApi();
  }
  return nocoApi;
};

module.exports = { getApi };
