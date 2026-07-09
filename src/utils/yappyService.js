const crypto = require("crypto");
const logger = require("./logger");
const { getUniqueReference } = require("./generateUniqueReference");
const { sendMessageBot } = require("../models/bots");
const repoPayments = require("../repositories/payments");
const modelPayments = require("../models/payments");
const { sendMessageToChannel } = require("./discordConnection");

/**
 * Service for integrating payments with Yappy.
 */
class YappyPaymentService {
  /**
   * @param {Object} config
   * @param {string} config.merchantId - Merchant ID provided by Yappy.
   * @param {string} config.secretKey - Base64 secret key for IPN signing.
   * @param {string} config.urlDomain - Base system domain for the IPN.
   */
  constructor({ merchantId, secretKey, urlDomain }) {
    this.isProduction = process.env.ENVIRONMENT === "production";

    this.apiUrl = this.isProduction
      ? process.env.YAPPY_API_URL_PROD
      : process.env.YAPPY_API_URL_DEV;

    this.internalDCChannelID = this.isProduction
      ? process.env.DISCORD_INTERNAL_PAYMENTS_WEBHOOK_PROD
      : process.env.DISCORD_INTERNAL_PAYMENTS_WEBHOOK_TEST;

    this.ipnUrl = process.env.YAPPY_IPN_URL;

    this.merchantId = merchantId;
    this.secretKey = secretKey;
    this.urlDomain = urlDomain;

    this.validateConfig();

    /**
     * Payment processing strategies based on the status received from Yappy.
     * @type {Object<string, Function>}
     * @property {Function} E - Strategy for successful payments.
     * @property {Function} R - Strategy for rejected payments.
     * @property {Function} C - Strategy for canceled payments.
     * @property {Function} X - Strategy for expired payments.
     */
    this.paymentStrategies = {
      /**
       * Processes a successful payment.
       * @param {Object} context - Payment context.
       * @param {Object} context.metadata - Payment metadata.
       * @param {string} context.companyID - Company ID.
       * @param {string} context.phone - Customer phone number.
       * @param {string} context.orderId - Order ID.
       * @param {string} context.providerID - Payment provider ID.
       * @param {number} context.amount - Payment amount.
       * @returns {Promise<{name: string, msg: string}>} Processing result.
       */
      E: async (context) => {
        const { metadata, companyID, phone, orderId, providerID, amount } =
          context;
        await modelPayments.savePaymentsByProvider(
          {
            companyID,
            phone,
            orderId,
            metadata,
            amount,
          },
          { providerID, status: "success", provider_response: metadata }
        );
        return {
          name: "success",
          msg: "We received your Yappy payment. Thank you for your purchase. If you need anything else, let us know.",
        };
      },
      /**
       * Processes a rejected payment.
       * @param {Object} context - Payment context.
       * @param {Object} context.metadata - Payment metadata.
       * @param {string} context.companyID - Company ID.
       * @param {string} context.phone - Customer phone number.
       * @param {string} context.orderId - Order ID.
       * @param {string} context.providerID - Payment provider ID.
       * @param {number} context.amount - Payment amount.
       * @returns {Promise<{name: string, msg: string}>} Processing result.
       */
      R: async (context) => {
        const { metadata, companyID, phone, orderId, providerID, amount } =
          context;
        await modelPayments.savePaymentsByProvider(
          {
            companyID,
            phone,
            orderId,
            metadata,
            amount,
          },
          { providerID, status: "failed", provider_response: metadata }
        );
        return {
          name: "failed",
          msg: "The Yappy payment was rejected. Please try again or contact support.",
        };
      },
      /**
       * Processes a canceled payment.
       * @param {Object} context - Payment context.
       * @param {Object} context.metadata - Payment metadata.
       * @param {string} context.companyID - Company ID.
       * @param {string} context.phone - Customer phone number.
       * @param {string} context.orderId - Order ID.
       * @param {string} context.providerID - Payment provider ID.
       * @param {number} context.amount - Payment amount.
       * @returns {Promise<{name: string, msg: string}>} Processing result.
       */
      C: async (context) => {
        const { metadata, companyID, phone, orderId, providerID, amount } =
          context;
        await modelPayments.savePaymentsByProvider(
          {
            companyID,
            phone,
            orderId,
            metadata,
            amount,
          },
          { providerID, status: "failed", provider_response: metadata }
        );
        return {
          name: "failed",
          msg: "You canceled the Yappy payment. Contact us if you need help.",
        };
      },
      /**
       * Processes an expired payment.
       * @param {Object} context - Payment context.
       * @param {string} context.providerStatusID - Provider status ID.
       * @param {string} context.phone - Customer phone number.
       * @param {string} context.orderId - Order ID.
       * @returns {Promise<{name: string, msg: string}>} Processing result.
       */
      X: async (context) => {
        const { providerStatusID, phone, orderId } = context;
        await repoPayments.updatePayments(
          {
            "payments.reference": orderId,
            "payments.phone": phone,
          },
          {
            "payments.status": providerStatusID,
          }
        );
        return {
          name: "timeout",
          msg: `The Yappy payment with reference ${orderId} has expired. Please try again.`,
        };
      },
    };

    logger.info(
      `YappyPaymentService initialized - Environment: ${
        this.isProduction ? "PRODUCTION" : "TEST"
      }`
    );
  }

  /**
   * Validates that the required parameters are defined.
   * @throws {Error} If any required parameter is missing.
   */
  validateConfig() {
    const required = {
      merchantId: this.merchantId,
      secretKey: this.secretKey,
      urlDomain: this.urlDomain,
    };

    const missing = Object.entries(required)
      .filter(([_, val]) => !val) //eslint-disable-line no-unused-vars
      .map(([key]) => key.toUpperCase());

    if (missing.length > 0) {
      sendMessageToChannel(this.internalDCChannelID, {
        message: `Missing required parameters to initialize YappyPaymentService: ${missing.join(
          ", "
        )}`,
      });

      throw new Error(
        "Fields missing for YappyPaymentService initialization: " +
          missing.join(", ")
      );
    }
  }

  /**
   * Validates the merchant with the Yappy API.
   * @returns {Promise<{ success: boolean, token?: string, epochTime?: number, data: any, error?: string }>}
   */
  async validateMerchant() {
    try {
      const url = `${this.apiUrl}/payments/validate/merchant`;
      logger.info(`Validating merchant - URL: ${url}`);
      logger.info({ merchantId: this.merchantId, urlDomain: this.urlDomain });

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: this.merchantId,
          urlDomain: this.urlDomain,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error validating merchant: status ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();

      if (data.status?.code !== "0000") {
        throw new Error(
          `Merchant validation failed: ${
            data.status?.description || "Unknown error"
          }`
        );
      }

      return {
        success: true,
        token: data.body?.token,
        epochTime: data.body?.epochTime,
        data,
      };
    } catch (error) {
      logger.error("Error validating merchant:", error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Creates a payment order.
   * @param {Object} orderData - Order data.
   * @param {string} orderData.aliasYappy - User alias in Yappy.
   * @param {number} orderData.subtotal - Subtotal before taxes.
   * @param {number} orderData.taxes - Taxes.
   * @param {number} orderData.total - Order total.
   * @param {string} orderData.currency - Currency.
   * @param {number} [orderData.paymentDate] - Payment date as epoch.
   * @param {number} [orderData.discount] - Applied discount.
   * @param {number} [orderData.shipping] - Shipping cost.
   * @returns {Promise<{ success: boolean, paymentUrl?: string, orderId?: string, transactionId?: string, token?: string, documentName?: string, data?: any, error?: string }>}
   */
  async createPaymentOrder(orderData) {
    try {
      orderData.orderId = await getUniqueReference();
      orderData.ipnUrl = this.ipnUrl;
      logger.info("Creating payment order:", orderData.orderId);

      const validation = await this.validateMerchant();
      if (!validation.success) {
        throw new Error(`Merchant validation failed: ${validation.error}`);
      }

      await this.checkPendingPays({
        phone: orderData.phone,
        botID: orderData.botID,
      });

      const url = `${this.apiUrl}/payments/payment-wc`;

      this.validateOrderData(orderData);

      const payload = {
        merchantId: this.merchantId,
        orderId: orderData.orderId,
        domain: this.urlDomain,
        paymentDate: orderData.paymentDate || Math.floor(Date.now() / 1000),
        aliasYappy: orderData.aliasYappy,
        ipnUrl: this.ipnUrl,
        shipping: this.formatAmount(orderData.shipping || 0.0),
        discount: this.formatAmount(orderData.discount || 0.0),
        taxes: this.formatAmount(orderData.taxes || 0.01),
        subtotal: this.formatAmount(orderData.subtotal - orderData.taxes),
        total: this.formatAmount(orderData.total),
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: validation.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        const errorCode = errorBody?.status?.code;
        const errorDesc = errorBody?.status?.description || "";

        const isUnregisteredPhone =
          errorDesc.includes("not registered") ||
          errorDesc.includes("no est") ||
          errorDesc.includes("registrado");

        if (errorCode === "E005" && isUnregisteredPhone) {
          throw new Error("Phone number not registered with Yappy");
        }

        throw new Error(errorDesc);
      }

      const data = await response.json();
      if (data.status?.code !== "0000") {
        throw new Error(
          `Order creation failed: ${
            data.status?.description || "Unknown error"
          }`
        );
      }

      return {
        success: true,
        transactionId: data.body?.transactionId,
        token: data.body?.token,
        documentName: data.body?.documentName,
        orderId: orderData.orderId,
      };
    } catch (error) {
      return {
        success: false,
        error: error,
        data: null,
      };
    }
  }

  /**
   * Validates required order fields.
   * @param {Object} orderData
   * @throws {Error} If any required field is missing or invalid.
   */
  validateOrderData(orderData) {
    const required = [
      "aliasYappy",
      "total",
      "subtotal",
      "taxes",
      "currency",
      "botID",
      "phone",
      "orderId",
      "ipnUrl",
    ];

    const missing = required.filter((f) => !orderData[f]);

    if (missing.length > 0) {
      sendMessageToChannel(this.internalDCChannelID, {
        message: `Missing required fields to create the payment order: ${missing.join(
          ", "
        )}`,
      });

      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    if (!/^[a-zA-Z0-9]{1,15}$/.test(orderData.orderId)) {
      throw new Error("Invalid orderId format");
    }

    if (parseFloat(orderData.total) < 0.01) {
      throw new Error("Invalid total amount");
    }
  }

  /**
   * Formats the amount as a string with 2 decimals.
   * @param {number|string} amount - Amount to format.
   * @returns {string} Amount formatted with 2 decimals.
   */
  formatAmount(amount) {
    return parseFloat(amount || 0).toFixed(2);
  }

  /**
   * Verifies the validity of a hash received in the IPN.
   * @param {string} orderId - Order ID.
   * @param {string} status - Payment status.
   * @param {string} domain - Merchant domain.
   * @param {string} receivedHash - Received hash to validate.
   * @returns {boolean} True if the hash is valid, otherwise false.
   */
  validateIPNHash(orderId, status, domain, receivedHash) {
    try {
      const values = Buffer.from(this.secretKey, "base64").toString("utf-8");
      const secrets = values.split(".");

      const signature = crypto
        .createHmac("sha256", secrets[0])
        .update(orderId + status + domain)
        .digest("hex");

      return signature === receivedHash;
    } catch (error) {
      logger.error("Error validating IPN hash:", error);
      return false;
    }
  }

  /**
   * Checks whether a pending payment exists for a phone number, bot, and provider (Yappy).
   *
   * Searches the database for a payment with pending status and Yappy provider,
   * matching the specified phone number and bot. If one is found,
   * throws an error informing the user that they already have a pending payment.
   *
   * @async
   * @function checkPendingPays
   * @param {Object} data - Object with the data required for the search.
   * @param {string} data.phone - Phone number associated with the payment.
   * @param {string} data.botID - UUID of the bot requesting the verification.
   * @throws {Error} If the Yappy provider does not exist, the pending status is not defined, or a pending payment exists.
   * @returns {Promise<void>} Returns `undefined` if no pending payment is found.
   */
  async checkPendingPays(data) {
    try {
      const { phone, botID } = data;

      const [providerField] = await repoPayments.getPaymentsProviderByField({
        "payments_provider.name": "Yappy",
      });

      if (!providerField) {
        throw new Error("Payment provider not found");
      }

      const { uuid_unique: yappyProviderID } = providerField;

      const [paymentStatusField] = await repoPayments.getPaymentsStatus({
        "payments_status.name": "pending",
      });

      if (!paymentStatusField) {
        throw new Error("Payment status not found");
      }

      const { uuid_unique: statusID } = paymentStatusField;

      const [paymentField] = await repoPayments.getLastPaymentsByField({
        "payments.phone": phone,
        "payments.status": statusID,
        "payments.provider": yappyProviderID,
        "payments.bot_id": botID,
      });

      if (paymentField) {
        const { reference } = paymentField;

        throw new Error(
          `A pending payment with reference ${reference} already exists`
        );
      }

      return;
    } catch (error) {
      throw new Error(error.message || "Unknown error");
    }
  }

  /**
   * Notifies the user about their payment status through the bot.
   * @param {string} botID - ID of the bot that will send the notification.
   * @param {string} phone - User phone number.
   * @param {string} status - Payment status (E, R, C, X).
   * @param {Object} context - Additional payment context.
   * @param {Object} context.metadata - Payment metadata.
   * @param {string} context.companyID - Company ID.
   * @param {string} context.orderId - Order ID.
   * @param {string} context.providerID - Payment provider ID.
   * @param {number} context.amount - Payment amount.
   * @returns {Promise<{msg: string}>} Message sent to the user.
   * @throws {Error} If the timeout payment status is not found.
   */
  async notifyUser(botID, phone, status, context) {
    const [PaymentTimeoutStatus] = await repoPayments.getPaymentsStatus({
      "payments_status.name": "timeout",
    });

    if (!PaymentTimeoutStatus) {
      throw new Error("Payment status not found");
    }

    const { uuid_unique: providerStatusID } = PaymentTimeoutStatus;

    const strategy = await this.paymentStrategies[status];

    const { msg, name } = await strategy({
      providerStatusID,
      ...context,
    });

    if (msg) {
      sendMessageBot({ botID: botID }, { message: msg, phone });
    }

    return { msg, name };
  }

  /**
   * Returns the active service configuration.
   * @returns {Object} Service configuration.
   * @returns {string} returns.environment - Current environment (production/test).
   * @returns {string} returns.apiUrl - Yappy API URL.
   * @returns {string} returns.merchantId - Merchant ID.
   * @returns {string} returns.urlDomain - Configured domain.
   */
  getConfig() {
    return {
      environment: this.isProduction ? "production" : "test",
      apiUrl: this.apiUrl,
      merchantId: this.merchantId,
      urlDomain: this.urlDomain,
    };
  }
}

module.exports = { YappyPaymentService };
