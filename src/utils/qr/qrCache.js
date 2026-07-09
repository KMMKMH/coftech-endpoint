const dayjs = require("dayjs");
const NodeCache = require("node-cache");
const EventEmitter = require("events");

class QRCacheManager extends EventEmitter {
  constructor() {
    super();
    this.accountToBot = new Map();
    this.botToAccounts = new Map();

    this.qrCache = new NodeCache({
      stdTTL: 210,
      checkperiod: 30,
      useClones: false,
      deleteOnExpire: false,
    });

    this.qrCache.on("expired", (botId) => this.onBotExpired(botId));
    this.qrCache.on("del", (botId) => this.#onBotDel(botId));
  }

  attach(accountId, botId) {
    const oldBot = this.accountToBot.get(accountId);
    if (oldBot && oldBot !== botId) this.#detach(accountId, oldBot);

    this.accountToBot.set(accountId, botId);
    if (!this.botToAccounts.has(botId))
      this.botToAccounts.set(botId, new Set());
    this.botToAccounts.get(botId).add(accountId);
  }

  detach(accountId, botId) {
    const currentBot = this.accountToBot.get(accountId);
    if (currentBot === botId) this.#detach(accountId, botId);
  }

  set(botId, qrData) {
    const { qr } = qrData;
    const item = {
      qr,
      expiresAt: dayjs().add(180, "seconds"),
    };

    this.qrCache.set(botId, item);
    return item;
  }

  get(accountId) {
    const botId = this.accountToBot.get(accountId);
    if (!botId) return null;
    const cached = this.qrCache.get(botId);
    return cached ? cached : null;
  }

  del(botId) {
    this.qrCache.del(botId);
  }

  getByBot(botId) {
    const cached = this.qrCache.get(botId);
    return cached ? cached : null;
  }

  getAccountsForBot(botId) {
    const set = this.botToAccounts.get(botId);
    return set ? [...set] : [];
  }

  #detach(accountId, botId) {
    this.accountToBot.delete(accountId);
    const set = this.botToAccounts.get(botId);
    if (set) {
      set.delete(accountId);
      if (set.size === 0) this.botToAccounts.delete(botId);
    }
  }

  #onBotDel(botId) {
    const accounts = this.botToAccounts.get(botId);
    if (accounts) accounts.forEach((acc) => this.accountToBot.delete(acc));
    this.botToAccounts.delete(botId);
  }

  onBotExpired(botId) {
    const accounts = this.getAccountsForBot(botId);
    this.emit("qr_expired", { botId, accounts });
    this.qrCache.del(botId);
  }

  flush() {
    this.qrCache.flushAll();
    this.accountToBot.clear();
    this.botToAccounts.clear();
  }
}

module.exports = new QRCacheManager();
