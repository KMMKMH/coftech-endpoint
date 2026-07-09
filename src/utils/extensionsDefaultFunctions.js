const { v4 } = require('uuid');

const extensionsDefaultFuncs = {
  WHATSAPP_WEBHOOK_SECRET: v4,
};

const extensionsDefaultKeys = Object.keys(extensionsDefaultFuncs);

module.exports = {
  extensionsDefaultFuncs,
  extensionsDefaultKeys,
};