const path = require("path");
const fs = require("fs");
const dayjs = require("dayjs");
const logger = require("../utils/logger");

const { parsePhoneNumberFromString } = require("libphonenumber-js");
const { generateJWT } = require("../utils/generateJWT");
const { getUniqueReference } = require("../utils/generateUniqueReference");
const { generateRandomCode } = require("../utils/codeGenerator");
const { sendMessageBot } = require("./bots");
const { decrypt: cardDecrypt } = require("../utils/vaultCard");
const { encrypt: cardEncrypt } = require("../utils/vaultCard");

const modelsBots = require("./bots");
const modelUrl = require("./url");

const repoBots = require("../repositories/bots");
const repoPayments = require("../repositories/payments");
const repoCompany = require("../repositories/company");
const repoAccounts = require("../repositories/accounts");
const repoUtils = require("../repositories/utils");

const processPaymentRequest = async (query) => {
  try {
    const { accountCardField, paymentProviderField, paymentField, secret } =
      query;

    const { name } = paymentProviderField;
    const { uuid_unique: paymentID } = paymentField;

    const directoryPath = path.join(
      __dirname,
      "../",
      "utils",
      "payments_provider"
    );
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

    const [inQueuePaymentField] = await repoPayments.getPaymentsQueueByField({
      "payments_queue.payment_id": paymentID,
    });
    if (inQueuePaymentField) {
      throw new Error("Payment already in queue.");
    }

    const encryptSecret = cardEncrypt(String(secret), String(paymentID));

    const paymentQueue = await repoPayments.savePaymentsQueue({
      "payments_queue.payment_id": paymentID,
      "payments_queue.account_card_id": accountCardField.uuid_unique,
      "payments_queue.status": "PENDING",
      "payments_queue.metadata": JSON.stringify({ secret: encryptSecret }),
    });

    return paymentQueue;
  } catch (error) {
    logger.error(
      `Error processing payment request with query ${JSON.stringify(
        query
      )}, error: ${error}`
    );
    throw new Error(error);
  }
};

const getProviders = async (query) => {
  try {
    const { companyID, botID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Incorrect bot ID ${botID}.`);
    }

    const providersFields = await repoPayments.getPaymentsProviderByField({});
    if (!providersFields || providersFields.length === 0) {
      throw new Error(`Providers not found.`);
    }

    const botAvailableProviders = [];
    const errors = [];

    for (const provider of providersFields) {
      const { extension_id: extensionID } = provider;
      const [assignedBotProviders] = await repoBots.getBotsExtensionsByField({
        "vbe.bot_id": botID,
        "vbe.extension_id": extensionID,
      });

      if (assignedBotProviders) {
        const matchedConfigTemplate =
          await repoCompany.getConfigsTemplatesByField({
            "configs_templates.owner_type": "extension",
            "configs_templates.extension_id": extensionID,
          });

        for (const providerExtensionConfig of matchedConfigTemplate) {
          const [extensionConfigField] =
            await repoCompany.getCompanyConfigByField({
              "company_configs.company_id": companyID,
              "company_configs.bot_id": botID,
              "configs_templates.owner_type": "extension",
              "configs_templates.key": providerExtensionConfig.key,
            });

          if (
            !extensionConfigField ||
            extensionConfigField.data == "" ||
            (extensionConfigField.data_type == "boolean" &&
              extensionConfigField.data != "true")
          ) {
            errors.push(provider.uuid_unique);
            break;
          }
        }

        if (errors.indexOf(provider.uuid_unique) === -1) {
          botAvailableProviders.push(provider);
        }
      }
    }

    return botAvailableProviders;
  } catch (error) {
    throw new Error(error);
  }
};

const savePaymentsByProvider = async (dataToSave, provider) => {
  try {
    let response;

    const { providerID, status, provider_response, provider_reference } =
      provider;

    let {
      companyID,
      botID,
      phone,
      amount,
      currencyID,
      orderId,
      error,
      transaction_type,
      products_list,
      metadata,
    } = dataToSave;

    metadata = {
      ...metadata,
      ...(products_list && { products_list }),
      ...(error && { error: JSON.stringify(error) }),
    };

    if (status === "pending") {
      const phoneNumber = parsePhoneNumberFromString(`+${phone}`);
      const [countryField] = await repoUtils.getCountriesByField({
        "countries.iso_alpha_2": phoneNumber?.country,
      });
      if (!countryField) {
        throw new Error(`Country not found for phone number ${phone}`);
      }
      const { iso_alpha_3 } = countryField;
      const [paymentTypeField] = await repoPayments.getPaymentsTypeByField({
        "payments_type.name": transaction_type,
      });
      if (!paymentTypeField) {
        throw new Error(
          `Payment type not found for transaction type ${transaction_type}`
        );
      }
      const { uuid_unique: paymentTypeID } = paymentTypeField;

      const [paymentStatusField] = await repoPayments.getPaymentsStatus({
        "payments_status.name": status,
      });
      if (!paymentStatusField) {
        throw new Error(`Payment status not found.`);
      }
      const [currencyField] = await repoUtils.getCurrenciesByField({
        "currencies.uuid_unique": currencyID,
      });
      if (!currencyField) {
        throw new Error(`Currency with ID${currencyID} not found`);
      }
      const { uuid_unique: paymentStatusID } = paymentStatusField;

      response = await repoPayments.savePayments({
        ...(botID && { "payments.bot_id": botID }),
        "payments.company_id": companyID,
        "payments.phone": phone,
        "payments.amount": amount,
        "payments.currency": currencyID,
        "payments.reference": orderId,
        "payments.provider": providerID,
        "payments.status": paymentStatusID,
        "payments.country": iso_alpha_3,
        "payments.payments_type": paymentTypeID,
        "payments.provider_response": provider_response
          ? JSON.stringify(provider_response)
          : null,
        "payments.provider_reference": provider_reference,
        "payments.metadata": metadata ?? null,
      });

      await repoPayments.savePaymentsLogs({
        "payments_logs.payment_id": response.uuid_unique,
        "payments_logs.phone": phone,
        "payments_logs.status": paymentStatusID,
        "payments_logs.amount": amount,
        "payments_logs.currency": currencyID,
        "payments_logs.provider": providerID,
        "payments_logs.provider_response": provider_response
          ? JSON.stringify(provider_response)
          : null,
        "payments_logs.provider_reference": provider_reference,
        "payments_logs.metadata": metadata ?? null,
      });
    } else if (status === "success" || status === "failed") {
      const [paymentStatusField] = await repoPayments.getPaymentsStatus({
        "payments_status.name": status,
      });

      const [paymentStatusPending] = await repoPayments.getPaymentsStatus({
        "payments_status.name": "pending",
      });

      const { uuid_unique: paymentStatusPendingID } = paymentStatusPending;

      const { uuid_unique: paymentStatusID } = paymentStatusField;

      const [paymentField] = await repoPayments.getPaymentsByField({
        "payments.reference": orderId,
      });
      const { uuid_unique: paymentID, metadata: oldMetadata } = paymentField;

      response = await repoPayments.updatePayments(
        {
          "payments.reference": orderId,
          "payments.phone": phone,
          "payments.status": paymentStatusPendingID,
          "payments.provider": providerID,
        },
        {
          "payments.status": paymentStatusID,
          "payments.provider_response": provider_response
            ? JSON.stringify(provider_response)
            : null,
          "payments.provider_reference": provider_reference,
          ...(metadata && {
            "payments.metadata": JSON.stringify({
              ...oldMetadata,
              ...metadata,
            }),
          }),
        }
      );

      await repoPayments.savePaymentsLogs({
        "payments_logs.payment_id": paymentID,
        "payments_logs.phone": phone,
        "payments_logs.status": paymentStatusID,
        "payments_logs.amount": amount,
        "payments_logs.currency": currencyID,
        "payments_logs.provider": providerID,
        "payments_logs.provider_response": provider_response
          ? JSON.stringify(provider_response)
          : null,
        "payments_logs.provider_reference": provider_reference,
        "payments_logs.metadata": error ? JSON.stringify(error) : null,
      });
    }

    return response;
  } catch (error) {
    logger.error(
      `Error saving payments by provider ${JSON.stringify(
        provider
      )} with data: ${JSON.stringify(dataToSave)}, error: ${error}`
    );
    throw new Error(error);
  }
};

const generatePaymentToken = async (query, body, urlOptions = {}) => {
  try {
    let { companyID, botID } = query;

    if (companyID) {
      const [companyField] = await repoCompany.getCompanyByField({
        "company.uuid_unique": companyID,
      });
      if (!companyField) {
        throw new Error(`Incorrect company ID ${companyID}.`);
      }
    }

    if (!botID) {
      const [configWPField] = await repoCompany.getCoreConfigsByField({
        "configs.key": "WP_BOT_CONTACT",
      });
      if (!configWPField) {
        return false;
      }

      const [payaBotField] = await repoBots.getBotsByField({
        "bots.identifier": configWPField.data,
      });
      if (!payaBotField) {
        throw new Error(`Incorrect bot ID ${botID}.`);
      }
      botID = payaBotField.uuid_unique;
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Incorrect bot ID ${botID}.`);
    }

    const [paymentStatusField] = await repoPayments.getPaymentsStatus({
      "payments_status.name": "pending",
    });
    if (!paymentStatusField) {
      throw new Error(`Payment status not found.`);
    }

    const { phone, providerID, currency } = body;

    const [paymentField] = await repoPayments.getLastPaymentsByField({
      "payments.phone": phone,
      "payments.status": paymentStatusField.uuid_unique,
    });
    if (paymentField) {
      const { reference, metadata } = paymentField;
      const message = `Hello, you have a pending payment with reference *${reference}*. This is the payment link: ${metadata.payment_link}`;
      sendMessageBot({ botID }, { message, phone });
      throw new Error(
        `Phone number ${phone} has a pending payment with reference ${reference}.`
      );
    }

    const orderId = await getUniqueReference();

    companyID ? companyID : (companyID = botField.company_id);

    const jwtToken = generateJWT(
      "CoftechPayment",
      {
        companyID,
        botID,
        ...body,
        orderId,
      },
      process.env.JWT_PAYMENT_SECRET,
      process.env.ENVIRONMENT == "development" ||
        process.env.ENVIRONMENT == "test" ||
        Object.keys(urlOptions).length
        ? { expiresIn: "1d" }
        : { expiresIn: "600000ms" }
    );

    const url = `${process.env.PAYMENT_DOMAIN}/${jwtToken}`;

    const dataUrl = Object.keys(urlOptions).length
      ? { url, ...urlOptions }
      : { time: 10, attempts: 0, url };

    const urlField = await modelUrl.saveUrl({ companyID }, dataUrl);
    if (!urlField) return;

    const { generated_url } = urlField;

    const { metadata } = body;
    delete body?.metadata;

    if (currency === "USD") {
      const [countryField] = await repoUtils.getCountriesByField({
        "countries.iso_alpha_3": "USA",
      });

      if (!countryField) {
        throw new Error(`Country USA not found`);
      }
    }

    const [currencyField] = await repoUtils.getCurrenciesByField({
      "currencies.code": currency,
    });

    if (!currencyField) {
      throw new Error(`Currency ${currency} not found`);
    }

    const { uuid_unique: currencyID } = currencyField;

    await savePaymentsByProvider(
      {
        companyID,
        botID,
        ...body,
        currencyID,
        orderId,
        metadata: {
          ...(metadata !== undefined ? metadata : {}),
          payment_link: generated_url,
        },
      },
      { providerID: providerID, status: "pending", provider_response: null }
    );

    return { jwtToken, url: generated_url };
  } catch (error) {
    logger.error(
      `Error generating payment token with query ${JSON.stringify(
        query
      )} and body ${JSON.stringify(body)}, error: ${error}`
    );
    throw new Error(error);
  }
};

const createPaymentAuthCode = async (data) => {
  try {
    const { botID, phone } = data;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot ID ${botID} not found.`);
    }

    const [accountCardField] = await repoAccounts.getAccountCardByField({
      "accounts_cards.phone": phone,
    });
    if (!accountCardField) {
      throw new Error(`Phone number ${phone} has no credit card associated`);
    }

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
      throw new Error(`Phone number ${phone} has no pending payment.`);
    }

    const [existPaymentAuthCode] = await repoPayments.getPaymentAuthCodeByField(
      {
        "payment_auth_codes.phone": phone,
        "payment_auth_codes.status": "active",
      }
    );
    if (existPaymentAuthCode) {
      return true;
    }

    const code = generateRandomCode(4);
    const expiration_time = dayjs()
      .add(10, "minute")
      .format("YYYY-MM-DD HH:mm:ss");

    const response = await repoPayments.savePaymentAuthCode({
      code,
      phone,
      expiration_time,
    });

    if (!response) {
      throw new Error(`Error creating payment auth code.`);
    }

    const message = `Your payment verification code is: *${response.code}*. \nPlease note that your code will expire in 10 minutes. \n\nTransaction ID: *${paymentField.reference}*`;
    await modelsBots.sendMessageBot({ botID }, { message, phone });

    delete response.code;
    return response;
  } catch (error) {
    logger.error(
      `Error creating payment auth code with data ${JSON.stringify(
        data
      )}, error: ${error}`
    );
    throw new Error(error);
  }
};

const updatePaymentAuthCodeStatus = async (data) => {
  try {
    const { code, phone, accountCardID, secret } = data;

    const [accountCardField] = await repoAccounts.getAccountCardByField({
      "accounts_cards.phone": phone,
      "accounts_cards.uuid_unique": accountCardID,
    });
    if (!accountCardField) {
      throw new Error(`Phone number ${phone} has no credit card associated`);
    }

    const validateCard = cardDecrypt(
      String(accountCardField.customer_vault_id),
      String(secret)
    );
    if (!validateCard) {
      const [pendingPaymentField] = await repoPayments.getPaymentsStatus({
        "payments_status.name": "pending",
      });
      if (!pendingPaymentField) {
        throw new Error(`Payment status not found.`);
      }

      const { uuid_unique: pendingPaymentStatus } = pendingPaymentField;

      const [paymentField] = await repoPayments.getLastPaymentsByField({
        "payments.phone": phone,
        "payments.status": pendingPaymentStatus,
      });
      if (!paymentField) {
        throw new Error(`Phone number ${phone} has no pending payment.`);
      }
      const { bot_id: botID } = paymentField;

      let message = `Your card verification code is incorrect. Your transaction was canceled. Please request another payment link.`;
      await sendMessageBot({ botID }, { message, phone });

      const [codeField] = await repoPayments.getPaymentAuthCodeByField({
        "payment_auth_codes.code": code,
        "payment_auth_codes.phone": phone,
      });
      if (!codeField) {
        throw new Error(`Code ${code} not found.`);
      }
      await repoPayments.updatePaymentAuthCodeStatus(
        codeField.uuid_unique,
        "expired"
      );

      const [failedPaymentStatus] = await repoPayments.getPaymentsStatus({
        "payments_status.name": "failed",
      });
      if (!failedPaymentStatus) {
        throw new Error(`Payment status not found.`);
      }
      const { uuid_unique: failedPaymentStatusID } = failedPaymentStatus;

      await repoPayments.updatePayments(
        {
          "payments.phone": phone,
          "payments.status": pendingPaymentStatus,
        },
        {
          "payments.status": failedPaymentStatusID,
        }
      );

      throw new Error(`Code ${code} has expired.`);
    }

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
      throw new Error(`Phone number ${phone} has no pending payment.`);
    }

    const [codeField] = await repoPayments.getPaymentAuthCodeByField({
      "payment_auth_codes.code": code,
      "payment_auth_codes.phone": phone,
    });
    if (!codeField) {
      throw new Error(`Code ${code} not found.`);
    }

    if (codeField.status !== "active") {
      throw new Error(`Code ${code} is not active.`);
    }

    const now = dayjs();
    const expirationTime = dayjs(codeField.expiration_time);
    if (now.isAfter(expirationTime)) {
      await repoPayments.updatePaymentAuthCodeStatus(
        codeField.uuid_unique,
        "expired"
      );
      throw new Error(`Code ${code} has expired.`);
    }

    await repoPayments.updatePaymentAuthCodeStatus(
      codeField.uuid_unique,
      "used"
    );

    const [paymentProviderField] =
      await repoPayments.getPaymentsProviderByField({
        "payments_provider.name": "NMI",
      });
    if (!paymentProviderField) {
      throw new Error(`Payment provider not found.`);
    }

    const [paymentTypeField] = await repoPayments.getPaymentsTypeByField({
      "payments_type.uuid_unique": paymentField.payments_type,
    });
    if (!paymentTypeField) {
      throw new Error(`Payment type not found.`);
    }

    await processPaymentRequest({
      accountCardField,
      paymentProviderField,
      paymentField,
      secret,
    });

    const [paymentAuthCodeUpdated] =
      await repoPayments.getPaymentAuthCodeByField({
        "payment_auth_codes.code": code,
        "payment_auth_codes.phone": phone,
      });
    if (!paymentAuthCodeUpdated) {
      throw new Error(`Payment auth code not found.`);
    }

    return paymentAuthCodeUpdated;
  } catch (error) {
    logger.error(
      `Error updating payment auth code status with data ${JSON.stringify(
        data
      )}, error: ${error}`
    );
    throw new Error(error);
  }
};

const getPaymentStatus = async (query) => {
  try {
    const { companyID, botID, referenceID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Incorrect bot ID ${botID}.`);
    }

    const [paymentField] = await repoPayments.getPaymentsByField({
      "payments.bot_id": botID,
      "payments.company_id": companyID,
      "payments.reference": referenceID,
    });

    if (!paymentField) {
      throw new Error(`Payment not found.`);
    }

    delete paymentField.id;
    return paymentField;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  savePaymentsByProvider,
  processPaymentRequest,
  getProviders,
  generatePaymentToken,
  createPaymentAuthCode,
  updatePaymentAuthCodeStatus,
  getPaymentStatus,
};
