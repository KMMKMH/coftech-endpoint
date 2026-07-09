const { getSocket } = require("../socket/socket");
const { repoBlacklist } = require("../../repositories/blacklist");
const repoBots = require("../../repositories/bots");
const { createUserRoom } = require("../socket/createRoomName");
const logger = require("../logger");
const qrCache = require("./qrCache");

class QREventHandler {
  constructor() {
    this.qrCache = qrCache;
  }

  initialize() {
    this.qrCache.on("qr_expired", (data) => this.handleQRExpired(data));
  }

  async handleQRExpired({ botId, accounts }) {
    const socket = getSocket();
    logger.info(`QR expired for bot ${botId}`);

    try {
      await repoBlacklist.delete({
        "blacklist.bot_id": botId,
        "blacklist.type": "BOT",
      });

      await repoBots.updateBot(
        { "bots.uuid_unique": botId },
        { identifier: "", suspended: true }
      );

      accounts.forEach((acc) => {
        this.qrCache.detach(acc, botId);
        this.qrCache.del(botId);

        const room = createUserRoom(acc);
        socket.to(room).emit("qr_time_expired", {
          process: "qr_time_expired",
          bot_id: botId,
          extra: { qr_time_expired: true },
        });
      });

      logger.info(`Successfully handled QR expiration for bot ${botId}`);
    } catch (error) {
      logger.error(
        `Error handling QR expiration for bot ${botId}: ${error.message}`
      );
    }
  }
}

module.exports = new QREventHandler();
