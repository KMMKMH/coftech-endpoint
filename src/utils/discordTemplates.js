/**
 * Discord embed templates for rich formatted notifications.
 * Provides centralized embed templates for Discord notifications.
 */

const COLORS = {
  SUCCESS: 0x22c55e,
  ERROR: 0xef4444,
  INFO: 0x3ba3f7,
  WARNING: 0xf59e0b,
  PROCESS: 0x1b89e6,
};

const discordEmbeds = {
  machineCreated: (instanceName) => ({
    title: "AWS Machine Created",
    color: COLORS.SUCCESS,
    fields: [
      { name: "Instance Name", value: `\`${instanceName}\``, inline: true },
      { name: "Status", value: "Created Successfully", inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Coftech AWS Manager" },
  }),

  machineDeleted: (instanceName, ip = null) => ({
    title: "AWS Machine Deleted",
    color: COLORS.WARNING,
    fields: [
      { name: "Instance Name", value: `\`${instanceName}\``, inline: true },
      { name: "Status", value: "Deleted Successfully", inline: true },
      ...(ip ? [{ name: "IP Address", value: `\`${ip}\``, inline: true }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Coftech AWS Manager" },
  }),

  commandExecuting: (ip, command) => ({
    title: "Command Execution",
    color: COLORS.PROCESS,
    fields: [
      { name: "Machine IP", value: `\`${ip}\``, inline: true },
      { name: "Status", value: "Executing", inline: true },
      {
        name: "Command",
        value: `\`\`\`bash\n${command}\n\`\`\``,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "SSH Command Executor" },
  }),

  installationCompleted: (ip) => ({
    title: "Installation Completed",
    color: COLORS.SUCCESS,
    fields: [
      { name: "Machine IP", value: `\`${ip}\``, inline: true },
      { name: "Status", value: "Successfully Completed", inline: true },
      {
        name: "Result",
        value: "All commands executed successfully",
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Installation Manager" },
  }),

  installationFailed: (ip, error) => ({
    title: "Installation Failed",
    color: COLORS.ERROR,
    fields: [
      { name: "Machine IP", value: `\`${ip}\``, inline: true },
      { name: "Status", value: "Failed", inline: true },
      { name: "Error", value: `\`\`\`\n${error}\n\`\`\``, inline: false },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Installation Manager" },
  }),

  connectionEstablished: (ip) => ({
    title: "Connection Established",
    color: COLORS.INFO,
    fields: [
      { name: "Target IP", value: `\`${ip}\``, inline: true },
      { name: "Status", value: "Connected", inline: true },
      { name: "Protocol", value: "SSH", inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "SSH Connection Manager" },
  }),

  connectionRetrying: (ip, seconds) => ({
    title: "Connection Retry",
    color: COLORS.WARNING,
    fields: [
      { name: "Target IP", value: `\`${ip}\``, inline: true },
      { name: "Retry In", value: `${seconds} seconds`, inline: true },
      { name: "Status", value: "Retrying", inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "SSH Connection Manager" },
  }),

  authenticationError: (ip) => ({
    title: "Authentication Error",
    color: COLORS.ERROR,
    fields: [
      { name: "Target IP", value: `\`${ip}\``, inline: true },
      { name: "Status", value: "Auth Failed", inline: true },
      { name: "Issue", value: "Invalid credentials or key", inline: false },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "SSH Authentication" },
  }),

  reportSummaryError: (
    botID,
    companyID,
    errorCode,
    errorMessage,
    metadata
  ) => ({
    title: `Weekly bot report error for \`${botID}\``,
    color: COLORS.ERROR,
    fields: [
      { name: "Code", value: `\`${errorCode}\``, inline: true },
      { name: "Company", value: `\`${companyID}\``, inline: true },
      { name: "Message", value: errorMessage },
      {
        name: "Metadata",
        value: `\`\`\`json\n${JSON.stringify(metadata, null, 2).substring(
          0,
          1000
        )}\`\`\``,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Lambda SNS Bot Summary" },
  }),

  emailAdminsSent: (
    botID,
    botName,
    companyName,
    recipients,
    type,
    service,
    details
  ) => ({
    title: "Admin Notification Email Sent",
    color: COLORS.SUCCESS,
    fields: [
      { name: "Bot ID", value: `\`${botID}\``, inline: true },
      { name: "Bot Name", value: botName, inline: true },
      { name: "Company", value: companyName, inline: true },
      {
        name: "Recipients",
        value: recipients.length > 0 ? recipients.join(", ") : "N/A",
        inline: false,
      },
      { name: "Notification Type", value: type || "N/A", inline: true },
      { name: "Service", value: service || "N/A", inline: true },
      {
        name: "Details",
        value: details || "No details provided",
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Email Admin Notification System" },
  }),

  emailAdminsFailed: (botID, errorMessage, errorStack, originalData) => ({
    title: "Failed to Send Admin Notification Email",
    color: COLORS.ERROR,
    fields: [
      {
        name: "Bot ID",
        value: botID ? `\`${botID}\`` : "N/A",
        inline: true,
      },
      { name: "Error Type", value: "Email Processing Error", inline: true },
      {
        name: "Error Message",
        value: errorMessage || "Unknown error occurred",
        inline: false,
      },
      {
        name: "Stack Trace",
        value: errorStack
          ? `\`\`\`\n${errorStack.substring(0, 1000)}\n\`\`\``
          : "No stack trace available",
        inline: false,
      },
      {
        name: "Original Event Data",
        value: `\`\`\`json\n${JSON.stringify(originalData, null, 2).substring(
          0,
          500
        )}\`\`\``,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Email Admin Notification System" },
  }),

  emailAdminsWarning: (botID, botName, companyName) => ({
    title: "Warning: Email Has No Recipients",
    color: COLORS.WARNING,
    fields: [
      { name: "Bot ID", value: `\`${botID}\``, inline: true },
      { name: "Bot Name", value: botName, inline: true },
      { name: "Company", value: companyName, inline: true },
      {
        name: "Message",
        value: "No administrators were found to notify",
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Email Admin Notification System" },
  }),

  botSteps: ({ msg, botName, companyName, extra }) => {
    const baseMessage = `${msg} bot ${botName} Company: ${companyName}`;

    if (extra?.disconnected) {
      return baseMessage;
    }

    if (extra?.config) {
      return `${baseMessage} - ${JSON.stringify(extra.config)}`;
    }

    if (extra) {
      return `${baseMessage} - ${JSON.stringify(extra)}`;
    }

    return baseMessage;
  },

  botMigrated: (botID, botName, companyName, sourceInstance, targetInstance) => ({
    title: "Bot Migrated to New Instance",
    color: COLORS.SUCCESS,
    fields: [
      { name: "Bot ID", value: `\`${botID}\``, inline: true },
      { name: "Bot Name", value: botName, inline: true },
      { name: "Company", value: companyName, inline: true },
      { name: "Source Instance", value: `\`${sourceInstance}\``, inline: true },
      { name: "Target Instance", value: `\`${targetInstance}\``, inline: true },
      { name: "Status", value: "Migration Completed", inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Bot Migration Manager" },
  }),
};

module.exports = {
  discordEmbeds,
};
