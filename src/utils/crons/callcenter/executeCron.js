const monitorQueueAssingAgent = require("./monitorQueueAssingAgent");
const monitorQueueChatTimeout = require("./monitorQueueChatTimeout");

async function executeCrons() {
  await monitorQueueChatTimeout();
  await monitorQueueAssingAgent();
}

module.exports = executeCrons;