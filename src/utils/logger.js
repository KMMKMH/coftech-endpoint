require("dotenv").config();
const winston = require("winston");
const Transport = require("winston-transport");
const https = require("https");

const LOG_COLORS = {
  ERROR: 0xef4444,
  WARNING: 0xf59e0b,
  INFO: 0x3ba3f7,
};

const parseWebhookUrl = (url) => {
  if (!url) return null;
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
    path: parsed.pathname,
    ssl: parsed.protocol === "https:",
  };
};

class DiscordTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.webhookUrl = opts.webhookUrl;
    this.username = opts.username || "Logger Bot";
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    const message = {
      username: this.username,
      embeds: [
        {
          title: `${info.level.toUpperCase()} Log`,
          description:
            typeof info.message === "string"
              ? info.message.substring(0, 2000)
              : JSON.stringify(info.message).substring(0, 2000),
          color:
            info.level === "error"
              ? LOG_COLORS.ERROR
              : info.level === "warn"
                ? LOG_COLORS.WARNING
                : LOG_COLORS.INFO,
          timestamp: new Date().toISOString(),
          fields: Object.keys(info)
            .filter((key) => !["level", "message", "timestamp"].includes(key))
            .slice(0, 10)
            .map((key) => ({
              name: key,
              value:
                typeof info[key] === "string"
                  ? info[key].substring(0, 1024)
                  : JSON.stringify(info[key]).substring(0, 1024),
              inline: false,
            })),
        },
      ],
    };

    const url = new URL(this.webhookUrl);
    const payload = JSON.stringify(message);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 204 && res.statusCode !== 200) {
        this.emit("warn", `Discord webhook returned status ${res.statusCode}`);
      }
    });

    req.on("error", (error) => {
      this.emit("warn", `Discord webhook error: ${error.message}`);
    });

    req.write(payload);
    req.end();

    callback();
  }
}

const infoEndpoint = parseWebhookUrl(process.env.WEBHOOK_INFO_ENDPOINT);
const errorEndpoint = parseWebhookUrl(process.env.WEBHOOK_ERROR_ENDPOINT);
const discordWebhookUrl =
  process.env.ENVIRONMENT === "production"
    ? process.env.DISCORD_BACKEND_PROD
    : process.env.DISCORD_BACKEND_TEST;

const orderedFormat = winston.format.printf(({ level, message, ...rest }) => {
  return JSON.stringify({
    level,
    message,
    ...rest,
  });
});

const logger = winston.createLogger({
  level: "info",
  format: orderedFormat,
  transports: [
    new winston.transports.Console({
      format: orderedFormat,
    }),
    ...(infoEndpoint
      ? [
        new winston.transports.Http({
          level: "info",
          host: infoEndpoint.host,
          port: infoEndpoint.port,
          path: infoEndpoint.path,
          ssl: infoEndpoint.ssl,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          json: true,
        }),
      ]
      : []),
    ...(errorEndpoint
      ? [
        new winston.transports.Http({
          level: "error",
          host: errorEndpoint.host,
          port: errorEndpoint.port,
          path: errorEndpoint.path,
          ssl: errorEndpoint.ssl,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          json: true,
        }),
      ]
      : []),
    ...(discordWebhookUrl
      ? [
        new DiscordTransport({
          level: "error",
          webhookUrl: discordWebhookUrl,
          username: "Coftech Bot Error Logger",
        }),
      ]
      : []),
  ],
});

module.exports = logger;
