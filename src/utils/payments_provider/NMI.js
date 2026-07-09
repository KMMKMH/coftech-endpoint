const repoCompany = require("../../repositories/company");

const { requestNMI } = require("../requestNMI");
const { savePaymentsByProvider } = require("../../models/payments");
const { sendMessageBot } = require("../../models/bots");
const repoPayments = require("../../repositories/payments");
const repoAWS = require("../../repositories/aws");
const { sendDataToInstance } = require("../sendDataToInstance");
const { BOT_EVENTS } = require("../events");
const createBotQueue = require("../rabbit/createBotQueue");

async function processNmiPayment(query, body, queue) {
  try {
    const { companyID, accountCardField, providerID } = query;

    const [nmiStatusConfig] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "NMI_STATUS",
    });

    if (!nmiStatusConfig || nmiStatusConfig.data === "false") {
      throw new Error("NMI is not enabled");
    }

    const [nmiApiKeyConfig] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "NMI_API_KEY",
    });
    if (!nmiApiKeyConfig || nmiApiKeyConfig.data === "") {
      throw new Error("NMI API Key is not set");
    }

    const { data: apiKey } = nmiApiKeyConfig;

    const {
      amount,
      currency,
      orderId,
      transaction_type,
      ccnumber,
      ccexp,
      cvv,
    } = body;
    const dataToSend = {
      amount,
      currency,
      orderid: orderId,
      type: transaction_type,
      security_key: apiKey,
      dup_seconds: 0,
      ccnumber,
      ccexp,
      cvv,
    };

    const response = await requestNMI(dataToSend, "POST", "api/transact.php");

    const [paymentField] = await repoPayments.getLastPaymentsByField({
      "payments.reference": orderId,
    });
    const { phone, amount: total, bot_id: botID, metadata } = paymentField;

    const { products_list: products } = metadata;

    if (response.response_code === "100") {
      savePaymentsByProvider(
        { companyID, ...accountCardField, ...body },
        {
          providerID,
          status: "success",
          provider_response: response,
          provider_reference: response.transactionid,
        }
      );

      repoPayments.updatePaymentsQueue(
        { "payments_queue.uuid_unique": queue.uuid_unique },
        { "payments_queue.status": "SUCCESS", "payments_queue.metadata": null }
      );

      const [promptPaymentGroup] = await repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "PROMPT_PAYMENTS_WP_GROUP",
      });

      if (promptPaymentGroup.data !== "") {
        const { data: groupName } = promptPaymentGroup;

        let messageToGroup = `🔔 *Purchase Record* 🔔\n📞 *Number:* ${phone}\n🛒 *Purchased Products:*\n\n`;

        products.forEach((product, index) => {
          const productTotal = product.price * product.quantity;

          messageToGroup += `${index + 1}. **${product.name}**\n   - Price: $${
            product.price
          }\n   - Quantity: ${
            product.quantity
          }\n   - Subtotal: $${productTotal}\n\n`;
        });

        messageToGroup += `💵 *Purchase total:* $${total}`;

        await sendMessageBot({ botID }, { messageToGroup, groupName });
      }
      const message = `Your payment was processed successfully. Thank you for your purchase. If you need anything else, let us know.`;
      await sendMessageBot({ botID }, { message, phone });

      const [instanceBotField] = await repoAWS.getInstanceBotsByField({
        "aws_instances_bots.bot_id": botID,
      });
      if (!instanceBotField) {
        throw new Error(`Bot with ID ${botID} does not have an instance.`);
      }

      const botQueue = createBotQueue(botID);
      await sendDataToInstance(
        botQueue,
        BOT_EVENTS.SAVE_MESSAGE_HISTORY,
        {
          bot_id: botID,
          message: message,
          message_type: "chat",
          chat_id: phone,
          messageTool: {
            functionArgs: products,
            functionName: "handlePaymentRequest",
          },
          isMessageToHistory: true,
          clearChat: true,
        }
      );
    } else if (response.response_code !== "100") {
      savePaymentsByProvider(
        { companyID, ...accountCardField, ...body },
        {
          providerID,
          status: "failed",
          provider_response: response,
          provider_reference: response?.transactionid,
        }
      );

      repoPayments.updatePaymentsQueue(
        { "payments_queue.uuid_unique": queue.uuid_unique },
        { "payments_queue.status": "FAILED", "payments_queue.metadata": null }
      );

      const message = `Your payment could not be processed. Please try again or contact us for more information.`;
      sendMessageBot({ botID }, { message, phone });

      const [instanceBotField] = await repoAWS.getInstanceBotsByField({
        "aws_instances_bots.bot_id": botID,
      });
      if (!instanceBotField) {
        throw new Error(`Bot with ID ${botID} does not have an instance.`);
      }

      const botQueue = createBotQueue(botID);
      await sendDataToInstance(
        botQueue,
        BOT_EVENTS.SAVE_MESSAGE_HISTORY,
        {
          bot_id: botID,
          message: message,
          message_type: "chat",
          chat_id: phone,
          messageTool: {
            functionArgs: products,
            functionName: "handlePaymentRequest",
          },
          isMessageToHistory: true,
          clearChat: true,
        }
      );
    }

    return response;
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = processNmiPayment;
