const axios = require("axios");
const { AxiosError } = require("axios");

const requestBotMaker = async (data) => {
  try {
    const { url, method, body, token } = data;
    const botMakerUrl = process.env.BOT_MAKER_URL;  
    const response = await axios({
      url: `${botMakerUrl}${url}`,
      method,
      ...(body && {data: body,}),
      headers: {
        "Content-Type": "application/json",
        "access-token": token,
      },
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response.status === 401) {
        throw new Error(
          "Unauthorized access to Bot Maker. Please check your token and try again."
        );
      } else {
        throw error.message;
      }
    }
  }
};

module.exports = requestBotMaker;
