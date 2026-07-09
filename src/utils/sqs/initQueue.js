const { Consumer } = require("sqs-consumer");
const { sqsClient } = require("./client");
const logger = require("../logger");

let sqsApp = null;

const initOrGetQueue = (queueUrl, handleMessageBatch) => {
  if (sqsApp) {
    return sqsApp;
  }

  const app = Consumer.create({
    queueUrl,
    handleMessageBatch,
    sqs: sqsClient,
    batchSize: 3,
    pollingWaitTimeMs: 20_000,
  });
  sqsApp = app;
  logger.info("Starting SQS Consumer");

  app.on("error", (err) => {
    logger.error(`SQS Consumer error: ${err.message}`);
  });

  app.on("processing_error", (err) => {
    logger.error(`SQS Consumer processing error: ${err.message}`);
  });

  app.on("timeout_error", (err) => {
    logger.error(`SQS Consumer timeout error: ${err.message}`);
  });

  app.start();

  return app;
};

const shutdownQueue = () => {
  if (sqsApp) {
    logger.info("Shutting down SQS Consumer");
    sqsApp.stop();
    sqsApp = null;
  }
};

module.exports = { initOrGetQueue, shutdownQueue };
