const axios = require("axios");

const requestXETUX = async (data) => {
  try {
    const { xetux_url, endpoint, method, body } = data;

    const response = await axios.request({
      method,
      url: `${xetux_url}/${endpoint}`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        ...body,
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Error in requestXETUX: ${error}`);
    return false;
  }
};

module.exports = requestXETUX;
