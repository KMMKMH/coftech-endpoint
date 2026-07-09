require("dotenv").config();
const Client = require("ssh2").Client;

const logger = require("./logger");
const { sendMessageToChannel } = require("./discordConnection");
const { discordEmbeds } = require("./discordTemplates");
const secretsManager = require("./awsSecretsManager");

const executeCommandsSequentially = (conn, commands, ipHost, callback) => {
  const executeSeries = (commands, i) => {
    if (i < commands.length) {
      conn.exec(commands[i], async function (err, stream) {
        if (err) throw err;
        const channelID =
          process.env.ENVIRONMENT == "development" ||
            process.env.ENVIRONMENT == "test"
            ? process.env.DISCORD_AWS_TEST
            : process.env.DISCORD_AWS_PROD;

        await sendMessageToChannel(channelID, {
          embeds: [discordEmbeds.commandExecuting(ipHost, commands[i])],
        });

        stream
          .on("close", function () {
            logger.info("Command executed:", commands[i].toString());
            executeSeries(commands, i + 1);
          })
          .on("data", function () {
            // logger.info("STDOUT:", data.toString());
          })
          .stderr.on("data", function () {
            // logger.info("STDERR:", data.toString());
          });
      });
    } else {
      logger.info("All commands have been executed.");
      callback();
    }
  };

  executeSeries(commands, 0);
};

const handleConnection = (conn, onReady, onError) => {
  conn.on("ready", onReady).on("error", onError);
};

const onReadyHandler = (conn, commands, ipHost) => {
  logger.info("Connection established to " + ipHost);
  executeCommandsSequentially(conn, commands, ipHost, () => {
    logger.info("Installation completed.");
    const channelID =
      process.env.ENVIRONMENT == "development" ||
        process.env.ENVIRONMENT == "test"
        ? process.env.DISCORD_AWS_TEST
        : process.env.DISCORD_AWS_PROD;

    Promise.all([
      sendMessageToChannel(channelID, {
        embeds: [discordEmbeds.installationCompleted(ipHost)],
      }),
    ]);
    conn.end();
  });
};

const onErrorHandler = (err, ipHost, commands) => {
  logger.error("Error:", err);
  if (err.level === "client-authentication") {
    logger.info("Authentication error:", err);
  } else if (err.level === "client-socket" || err.level === "client-timeout") {
    logger.info(
      `${err.level === "client-socket" ? "Connection" : "Timeout"} error:`,
      err,
    );
    logger.info("Retrying connection in 20 seconds...");
    setTimeout(
      () => executeSSHCommands(ipHost, commands),
      20000,
    );
  } else {
    logger.info("Other error:", err);
  }
};

const executeSSHCommands = async (ipHost, commands) => {
  const conn = await connectSSH(ipHost);

  logger.info(`Trying connection to ${ipHost}`);
  handleConnection(
    conn,
    () => onReadyHandler(conn, commands, ipHost),
    (err) => onErrorHandler(err, ipHost, commands),
  );
};

const connectSSH = async (ipHost) => {
  const conn = new Client();

  const secretName = process.env.AWS_SSH_SECRET_NAME;
  let privateKeyContent = await secretsManager.getSecret(secretName);

  if (typeof privateKeyContent === "string") {
    privateKeyContent = privateKeyContent.replace(/\\n/g, "\n");

    if (!privateKeyContent.includes("-----BEGIN")) {
      logger.error("The SSH key is not in the correct PEM format");
      throw new Error("Invalid SSH key format: missing PEM headers");
    }
    privateKeyContent = Buffer.from(privateKeyContent, "utf-8");

    logger.info("SSH key loaded successfully from AWS Secrets Manager");
  }

  conn.connect({
    host: ipHost,
    port: 22,
    username: "ubuntu",
    privateKey: privateKeyContent,
    readyTimeout: 20000,
  });
  return conn;
};

module.exports = { executeSSHCommands };
