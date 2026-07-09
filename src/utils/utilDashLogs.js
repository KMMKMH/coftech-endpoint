const utilActionType = Object.freeze({
  Update: "update",
  Delete: "delete",
  Create: "create",
  Initialize: "initialize",
  CancelInitialization: "cancel inititialization",
  Stop: "stop",
  Restart: "restart",
  Start: "start",
  Save: "save",
  Disable: "disable",
  Enabled: "enabled",
  Upload: "upload",
  Error: "error",
  Disconnect: "disconnect",
});

const utilResourceType = Object.freeze({
  Account: "account",
  Bot: "bot",
  BotConfig: "bot_config",
  BotExtension: "bot_extension",
  Company: "company",
  CompanyConfig: "company_config",
  File: "file",
  Prompt: "prompt",
});

module.exports = {
  utilActionType,
  utilResourceType,
};
