const { sendMessageBot } = require("../../../models/bots");
const { sendDataToInstance } = require("../../sendDataToInstance");
const logger = require("../../logger");

const repoPayments = require("../../../repositories/payments");
const repoAWS = require("../../../repositories/aws");
const { BOT_EVENTS } = require("../../../utils/events");
const createBotQueue = require("../../../utils/rabbit/createBotQueue");

const monitorTimeoutPayments = async () => {
  try {
    const [providerField] = await repoPayments.getPaymentsProviderByField({
      "payments_provider.name": "Yappy",
    });

    if (!providerField) {
      logger.warn("Yappy provider was not found");
      return;
    }

    const { uuid_unique: yappyProviderId } = providerField;

    const [timeoutStatusField] = await repoPayments.getPaymentsStatus({
      "payments_status.name": "timeout",
    });

    if (!timeoutStatusField) return;

    const rawCondition = `
      payments.status = '${timeoutStatusField.uuid_unique}' AND
      payments.timeout_notified = false AND
      payments.timeout_notified_at IS NULL AND
      payments.provider != '${yappyProviderId}'
      `;

    const timeoutPayments = await repoPayments.getPaymentsByField(
      rawCondition,
      true
    );

    if (timeoutPayments.length > 0) {
      for (const payment of timeoutPayments) {
        const { phone, reference, bot_id, metadata } = payment;

        try {
          const timeoutMessage = `Sorry, the time to complete the payment with reference *${reference}* has expired. If you still want to complete the purchase, please request a new payment link.`;

          await sendMessageBot(
            { botID: bot_id },
            { message: timeoutMessage, phone }
          );

          const [instanceBotField] = await repoAWS.getInstanceBotsByField({
            "aws_instances_bots.bot_id": bot_id,
          });

          if (instanceBotField) {
            const botQueue = createBotQueue(bot_id);
            await sendDataToInstance(
              botQueue,
              BOT_EVENTS.SAVE_MESSAGE_HISTORY,
              {
                bot_id,
                message: timeoutMessage,
                message_type: "chat",
                chat_id: phone,
                messageTool: {
                  functionName: "handlePaymentRequest",
                  functionArgs: { ...metadata?.products_list },
                },
                isMessageToHistory: true,
              }
            );
          }

          await repoPayments.updatePayments(
            {
              "payments.reference": reference,
            },
            {
              "payments.timeout_notified": true,
              "payments.timeout_notified_at": new Date(),
            }
          );
        } catch (error) {
          console.error(
            `Error processing payment with reference ${reference}:`,
            error
          );
          logger.error(
            `Error processing payment with reference ${reference}: ${error.message}`
          );
          continue;
        }
      }
    }
  } catch (error) {
    console.error("MonitorTimeoutPayments error:", error);
    logger.error(`MonitorTimeoutPayments error: ${error.message}`);
  }
};

module.exports = monitorTimeoutPayments;
