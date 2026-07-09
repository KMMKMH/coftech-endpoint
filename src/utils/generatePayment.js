const { sendMessageBot } = require("../models/bots");
const { sendDataToInstance } = require("./sendDataToInstance");

const repoBots = require("../repositories/bots");
const repoPayments = require("../repositories/payments");
const repoAWS = require("../repositories/aws");
const repoUtils = require("../repositories/utils");

const modelPayments = require("../models/payments");
const { getYappyClient } = require("./getYappyClient");
const { BOT_EVENTS } = require("../utils/events");
const createBotQueue = require("../utils/rabbit/createBotQueue");

const generatePaymentLink = async (data) => {
  try {
    const {
      bot_id,
      phone,
      amount,
      currency,
      transaction_type,
      products_list,
      payment_method,
      functionArgs,
      functionName,
      phone_number,
    } = data;

    let messageTemplate = "";

    const productsText = products_list.reduce((acc, product, index) => {
      const productTotal = product.price * product.quantity;
      return (
        acc +
        `${index + 1}. *${product.name}*\n   - Price: $${
          product.price
        }\n   - Quantity: ${
          product.quantity
        }\n   - Subtotal: $${productTotal}\n\n`
      );
    }, "");

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": bot_id,
    });
    if (!botField) return;

    const { company_id: companyID } = botField;

    const [currencyField] = await repoUtils.getCurrenciesByField({
      "currencies.code": currency,
    });
    if (!currencyField) {
      throw new Error(`Currency code ${currency} not found.`);
    }
    const { uuid_unique: currencyID } = currencyField;

    if (payment_method.toLowerCase() === "card") {
      const [paymentProviderField] =
        await repoPayments.getPaymentsProviderByField({
          "payments_provider.name": "NMI",
        });
      if (!paymentProviderField) {
        throw new Error(`Payment provider not found.`);
      }
      const { uuid_unique: providerID } = paymentProviderField;

      const response = await modelPayments.generatePaymentToken(
        { companyID, botID: bot_id },
        {
          phone,
          amount,
          currencyID,
          transaction_type,
          products_list,
          providerID,
        }
      );

      const [paymentStatusField] = await repoPayments.getPaymentsStatus({
        "payments_status.name": "pending",
      });
      if (!paymentStatusField) {
        throw new Error(`Payment status not found.`);
      }

      const [paymentField] = await repoPayments.getLastPaymentsByField({
        "payments.phone": phone,
        "payments.status": paymentStatusField.uuid_unique,
      });
      if (!paymentField) {
        throw new Error(`The last payment not found for phoneNumber ${phone}.`);
      }

      const { reference } = paymentField;
      const { url: payment_link } = response;

      messageTemplate =
        `Hello!\n\nTo complete your payment of $${amount} ${currency} with reference *${reference}*, ` +
        `use this link *(remember it is valid for 10 minutes)*: ${payment_link}.\n\n*Product list:*\n\n` +
        `${productsText}\n\nOnce the payment is completed, you will receive confirmation.\n\nIf you have any questions, we are here to help.`;
    } else if (payment_method.toLowerCase() === "yappy") {
      const yappyService = await getYappyClient(companyID, bot_id);

      const { orderId, success, error } = await yappyService.createPaymentOrder(
        {
          aliasYappy: phone_number,
          total: amount,
          subtotal: amount,
          taxes: 0.1,
          currency,
          botID: bot_id,
          phone,
        }
      );

      if (!success) {
        if (
          error?.message?.includes("The phone number is not registered") ||
          error?.message?.includes("A pending payment exists with reference")
        ) {
          await sendMessageBot(
            { botID: bot_id },
            {
              message: error.message,
              phone,
            }
          );
        } else {
          await sendMessageBot(
            { botID: bot_id },
            {
              message:
                "Sorry, an error occurred while generating the Yappy payment receipt. Please try again later.",
              phone,
            }
          );
        }

        throw new Error(error?.message || error);
      }

      messageTemplate = `Hello!

We generated a Yappy payment order for *$${amount}* with reference ${orderId}.
Please check your Yappy app to complete the payment.

Once confirmed, you will receive the corresponding notification.
If you have any questions, we are here to help.`;

      const [yappyProviderField] =
        await repoPayments.getPaymentsProviderByField({
          "payments_provider.name": "Yappy",
        });

      if (!yappyProviderField) {
        throw new Error(`Yappy provider not found.`);
      }

      const { uuid_unique: providerID } = yappyProviderField;

      await modelPayments.savePaymentsByProvider(
        {
          companyID,
          botID: bot_id,
          phone,
          amount,
          currencyID,
          transaction_type,
          products_list,
          orderId,
        },
        { providerID, status: "pending", provider_response: null }
      );
    }

    sendMessageBot({ botID: bot_id }, { message: messageTemplate, phone });

    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": bot_id,
    });

    if (!instanceBotField) {
      throw new Error(`Bot with ID ${bot_id} does not have an instance.`);
    }

    const botQueue = createBotQueue(bot_id);
    await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_MESSAGE_HISTORY, {
      bot_id: bot_id,
      message: messageTemplate,
      message_type: "chat",
      chat_id: phone,
      messageTool: { functionArgs, functionName },
      isMessageToHistory: true,
    });
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = { generatePaymentLink };
