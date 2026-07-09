require("dotenv").config();
require("express-async-errors");
const express = require("express");
const PORT = process.env.PORT || 3000;
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger/index");
const cors = require("cors");
const http = require("http");
const util = require("util");
const logger = require("./utils/logger");
const path = require("path");
const { initializeSocket } = require("./utils/socket/socket");
const { setup: rabbitSetup } = require("./utils/rabbitConnection");

const mainRouter = require("./routes/index");
const jwtValidations = require("./utils/routerBaseValidation");
const corsOptionsDelegate = require("./utils/corsDelegate");
const initializeCronjobs = require("./utils/cronjobs");

const { listSupportedLanguages } = require("./repositories/supportedLanguages");
const { setSupportedLanguages } = require("./utils/languageCache");
const { initOrGetQueue, shutdownQueue } = require("./utils/sqs/initQueue");
const handleMessageBatch = require("./utils/sqs/handleMessageBatch");
const errorHandler = require("./utils/middleware/errorHandler");
const { registerSocketHandlers } = require("./utils/socket/listeners");
const qrEventHandler = require("./utils/qr/qrEventHandler");

const graphql = require("./graphql");

(async () => {
  const langs = await listSupportedLanguages();
  setSupportedLanguages(langs);

  const app = express();
  const server = http.createServer(app);

  registerSocketHandlers(initializeSocket(server));
  rabbitSetup();
  initializeCronjobs();
  initOrGetQueue(process.env.AWS_SQS_FILEMANAGER_QUEUE_URL, handleMessageBatch);
  qrEventHandler.initialize();

  app.set("trust proxy", true);
  app.use(express.static(path.join(__dirname, "public")));
  app.route("/call").get((req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
  });

  app.use(express.json({ limit: "1gb" }));

  if (process.env.ENVIRONMENT !== "production") {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } else {
    app.use("/api-docs", (_req, res) => {
      res.status(403).json({ error: "Access denied" });
    });
  }

  app.use("/graphql", graphql);

  app.use(cors());
  app.use([jwtValidations, corsOptionsDelegate]);
  app.use(mainRouter);
  app.use(errorHandler);

  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
})();

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION - Process will exit:", err);
  shutdownQueue();

  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("UNHANDLED REJECTION:", {
    promise: util.inspect(promise),
    reason: util.inspect(reason),
  });

  shutdownQueue();

  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received - Shutting down gracefully");
  shutdownQueue();
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received - Shutting down gracefully");
  shutdownQueue();
  process.exit(0);
});
