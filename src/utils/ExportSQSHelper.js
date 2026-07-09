const { SendMessageCommand } = require("@aws-sdk/client-sqs");
const { sqsClient } = require("./sqs/client");
const { v4: uuidv4 } = require("uuid");
const logger = require("./logger");

class ExportSQSHelper {
  constructor() {
    this.sqs = sqsClient;
    this.queueUrl = process.env.AWS_SQS_QUEUE_URL;
    this.queueCancelUrl = process.env.AWS_SQS_QUEUE_URL_CANCEL;
    this.maxRetries = 3;
    this.version = "v1.0";
  }

  async sendMessageWithRetries(params, correlationId, attempt = 1) {
    try {
      const command = new SendMessageCommand(params);
      const result = await this.sqs.send(command);
      logger.info(`[SQS] Message sent: ${result.MessageId} - ${correlationId}`);
      return result.MessageId;
    } catch (error) {
      logger.error(
        `[SQS] Error sending message (attempt ${attempt}) - ${correlationId}: ${error.message}`
      );
      if (attempt < this.maxRetries) {
        const delay = 2 ** attempt * 100;
        await new Promise((res) => setTimeout(res, delay));
        return this.sendMessageWithRetries(params, correlationId, attempt + 1);
      }
      throw error;
    }
  }

  async sendCreateExportMessage(exportData) {
    const correlationId = exportData.exportId || uuidv4();
    const payload = {
      action: "CREATE_EXPORT",
      version: this.version,
      messageId: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        exportId: correlationId,
        userId: exportData.userId,
        botId: exportData.botId,
        botPhone: exportData.botPhone,
        clientPhone: exportData.clientPhone,
        networkId: exportData.networkId,
        providerId: exportData.providerId,
        parameters: {
          fromDate: exportData.fromDate || null,
          toDate: exportData.toDate || null,
          includeMedia: exportData.includeMedia || false,
          isFullChat: exportData.isFullChat || false,
        },
      },
    };

    const params = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(payload),
      MessageAttributes: {
        action: { DataType: "String", StringValue: "CREATE_EXPORT" },
        exportId: { DataType: "String", StringValue: correlationId },
        userId: { DataType: "String", StringValue: exportData.userId },
        version: { DataType: "String", StringValue: this.version },
      },
    };

    return this.sendMessageWithRetries(params, correlationId);
  }

  async sendCancelExportMessage(exportId, userId, reason = "user_requested") {
    const correlationId = exportId;
    const payload = {
      action: "CANCEL_EXPORT",
      version: this.version,
      messageId: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: { exportId, userId, reason },
    };

    const params = {
      QueueUrl: this.queueCancelUrl,
      MessageBody: JSON.stringify(payload),
      MessageAttributes: {
        action: { DataType: "String", StringValue: "CANCEL_EXPORT" },
        exportId: { DataType: "String", StringValue: exportId },
        userId: { DataType: "String", StringValue: userId },
        priority: { DataType: "String", StringValue: "high" },
        version: { DataType: "String", StringValue: this.version },
      },
    };

    logger.info(
      `[SQS] Sending cancel message for exportId: ${exportId}, reason: ${reason}`
    );
    return this.sendMessageWithRetries(params, correlationId);
  }
}

module.exports = ExportSQSHelper;
