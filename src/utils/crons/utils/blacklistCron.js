const repoBots = require("../../../repositories/bots");
const modelBots = require("../../../models/bots");

const blacklistCron = async () => {
  const bots = await repoBots.getBotsByField({});

  for (const bot of bots) {
    await modelBots.sendBotBlacklist({ bot_id: bot.uuid_unique });
  }
};

module.exports = blacklistCron;