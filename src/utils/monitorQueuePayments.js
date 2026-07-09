const logger = require("./logger");
const repoPayments = require("../repositories/payments");
const repoAccounts = require("../repositories/accounts");
const repoStore = require("../repositories/store");
const fs = require("fs");
const path = require("path");
const { decrypt: cardDecrypt } = require("./vaultCard");
const dayjs = require("dayjs");

const monitorQueuePayments = async () => {
  try {
    const [paymentQueueField] = await repoPayments.getPaymentsQueueByField({
      "payments_queue.status": "PENDING",
    });
    if (!paymentQueueField) {
      return;
    }

    const [paymentField] = await repoPayments.getPaymentsByField({
      "payments.uuid_unique": paymentQueueField.payment_id,
    });
    if (!paymentField) {
      throw new Error(`Payment ID ${paymentQueueField.payment_id} not found.`);
    }

    const [accountCardField] = await repoAccounts.getAccountCardByField({
      "accounts_cards.uuid_unique": paymentQueueField.account_card_id,
    });
    if (!accountCardField) {
      throw new Error(
        `Account card ID ${paymentQueueField.account_card_id} not found.`
      );
    }

    const { customer_vault_id } = accountCardField;
    const { metadata, payment_id } = paymentQueueField;
    const secret = cardDecrypt(metadata.secret, payment_id);
    if (!secret) {
      throw new Error("Secret is empty");
    }

    const cardDecrypted = cardDecrypt(String(customer_vault_id), secret);
    if (!cardDecrypted) {
      throw new Error("Card is empty");
    }

    const ccexp = cardDecrypted.slice(0, 4);
    const ccnumber = cardDecrypted.slice(4);

    const [providerField] = await repoPayments.getPaymentsProviderByField({
      "payments_provider.name": "NMI",
    });
    if (!providerField) {
      throw new Error(`Incorrect provider ID ${paymentField.provider}.`);
    }
    const { name } = providerField;

    const directoryPath = path.join(__dirname, "payments_provider");  
    const fileNames = fs.readdirSync(directoryPath);
    const matchedFileName = fileNames.find((fileName) =>
      fileName.includes(name)
    );
    if (!matchedFileName) {
      throw new Error(`File not found for provider: ${name}`);
    }
    const matchedFileModule = require(path.join(
      directoryPath,
      matchedFileName
    ));
    if (typeof matchedFileModule !== "function") {
      throw new Error(`File not found for provider: ${name}`);
    }

    logger.info(
      `Processing payment request for payment ID ${paymentField.uuid_unique}.`
    );

    const [transactionTypeField] = await repoPayments.getPaymentsTypeByField({
      "payments_type.uuid_unique": paymentField.payments_type,
    });
    if (!transactionTypeField) {
      throw new Error(
        `Incorrect transaction type ${paymentField.payments_type}.`
      );
    }

    const queryData = {
      companyID: paymentField.company_id,
      providerID: providerField.uuid_unique,
      accountCardField,
      phoneNumber: accountCardField.phone,
    };

    const bodyData = {
      amount: paymentField.amount,
      transaction_type: transactionTypeField.name,
      orderId: paymentField.reference,
      currency: paymentField.currency,
      ccnumber,
      ccexp,
      cvv: secret,
    };

    const providerResponse = await matchedFileModule(queryData, bodyData, {
      uuid_unique: paymentQueueField.uuid_unique,
    });
    if (!providerResponse) {
      throw new Error("Provider response is empty.");
    } else {
      await logStoreItemPayment(paymentField.uuid_unique);
    }
  } catch (error) {
    logger.error(error.message);
  }
};

const logStoreItemPayment = async (paymentID) => {
  const [paymentField] = await repoPayments.getLastPaymentsByField({
    "payments.uuid_unique": paymentID,
  });
  if (!paymentField) {
    throw new Error(`Payment ID ${paymentID} not found.`);
  }
  const { status_name, metadata, companyID } = paymentField;
  const { products_list, store_item_details } = metadata;
  if (status_name === "success") {
    const { itemID, botID } = store_item_details;
    const [itemField] = await repoStore.getStoreItemsByField({
      "store_items.uuid_unique": itemID,
    });
    if (!itemField) {
      throw new Error(`Item ID ${itemID} not found.`);
    }
    const { is_periodic } = itemField;

    const storeLogData = {
      "store_logs.store_item_id": itemID,
      "store_logs.company_id": companyID,
      "store_logs.purchase_date": dayjs().format("YYYY-MM-DD HH:mm:ss"),
      "store_logs.activation_date": dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };

    if (botID) {
      storeLogData["store_logs.bot_id"] = botID;
    }

    if (products_list) {
      storeLogData["store_logs.total_price"] = products_list.price * products_list.quantity;
      storeLogData["store_logs.quantity"] = products_list.quantity;
    }

    if (is_periodic) {
      storeLogData["store_logs.renewal_date"] = dayjs().add(1, "month").format("YYYY-MM-DD HH:mm:ss");
    }

    await repoStore.saveStoreLog(storeLogData);
  }
};

module.exports = monitorQueuePayments;
