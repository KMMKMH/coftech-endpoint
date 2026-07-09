const logger = require("./logger");

const pendingUpdates = new Map();
const processingBots = new Set();
const debounceTimers = new Map();

async function queueEventBridgeUpdate(botID, updateFn, debounceMs = 500) {
  pendingUpdates.set(botID, updateFn);

  if (debounceTimers.has(botID)) {
    clearTimeout(debounceTimers.get(botID));
  }

  const timer = setTimeout(async () => {
    debounceTimers.delete(botID);

    if (!processingBots.has(botID)) {
      await processUpdate(botID);
    }
  }, debounceMs);

  debounceTimers.set(botID, timer);
}

async function processUpdate(botID) {
  if (!pendingUpdates.has(botID)) return;

  processingBots.add(botID);

  try {
    while (pendingUpdates.has(botID)) {
      const fn = pendingUpdates.get(botID);
      pendingUpdates.delete(botID);

      try {
        await fn();
        logger.info(`[EventBridge] ✅ Updated bot ${botID}`);
      } catch (error) {
        logger.error(`[EventBridge] ❌ Failed bot ${botID}:`, error);
        throw error;
      }

      if (pendingUpdates.has(botID)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } finally {
    processingBots.delete(botID);
  }
}

module.exports = { queueEventBridgeUpdate };
