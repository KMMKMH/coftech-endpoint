require("dotenv").config();
const axios = require("axios");

async function sendMessageToChannel(webhookID, { message, embeds }) {
  try {
    const messageData = {
      ...(message && { content: message }),
      ...(embeds && { embeds }),
      username: "Coftech Bot",
      avatar_url: process.env.DISCORD_AVATAR
    };

    axios
      .post(webhookID, messageData)
      .then((response) => {
        console.log("Discord message sent!:", response.status);
      })
      .catch((error) => {
        console.error("Error sending Discord message:", error);
      });
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  sendMessageToChannel,
};
