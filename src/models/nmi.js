const modelPayments = require("./payments");
const repoPayments = require("../repositories/payments");
const repoAccounts = require("../repositories/accounts");
const repoCompany = require("../repositories/company");
const repoNMI = require("../repositories/nmi");
const repoUtils = require("../repositories/utils");

const { requestNMI } = require("../utils/requestNMI");
const { getUniqueReference } = require("../utils/generateUniqueReference");

const getTransactionalData = async (query) => {
  try {
    const { companyID, customerVaultId, email } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with ID ${companyID} not found.`);
    }

    const [nmiConfigStatus, nmiConfigKey] = await Promise.all([
      repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "NMI_STATUS",
      }),
      repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "NMI_API_KEY",
      }),
    ]);
    if (!nmiConfigStatus.length && !nmiConfigKey.length) {
      throw new Error(`NMI configuration not found for company ${companyID}.`);
    }

    const { data: isActivated } = [nmiConfigStatus];
    const { data: apiKey } = [nmiConfigKey];

    if (!isActivated || !apiKey) {
      throw new Error(
        `NMI is not activated or API key is missing for company ${companyID}.`
      );
    }

    const data = {
      customer_vault: "get_customer",
      maxBodyLength: Infinity,
      security_key: apiKey,
      ...(customerVaultId && { customer_vault_id: customerVaultId }),
      ...(email && { email }),
    };

    const response = await requestNMI(data, "POST", "api/query.php");

    return response.nm_response.transaction;
  } catch (error) {
    throw new Error(error);
  }
};

const getPlanSubscription = async (query) => {
  try {
    let customerVaultIdData, phoneData;

    const { customerVaultId, phone } = query;

    if (customerVaultId)
      customerVaultIdData = {
        "accounts_cards.customer_vault_id": customerVaultId,
      };
    if (phone) phoneData = { "accounts_cards.phone": phone };

    const [accountCardField] = await repoAccounts.getAccountCardByField({
      ...customerVaultIdData,
      ...phoneData,
    });
    if (!accountCardField) {
      throw new Error("Account card not found.");
    }

    const [subscriptionField] = await repoNMI.getNmiSubscriptionByField({
      "payments_subscriptions.customer_vault_id":
        accountCardField.customer_vault_id,
    });
    if (!subscriptionField) {
      throw new Error("Subscription not found.");
    }

    return subscriptionField;
  } catch (error) {
    throw new Error(error);
  }
};

const listPlanSubscriptions = async (query) => {
  try {
    const { companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with ID ${companyID} not found.`);
    }

    const [paymentTypeField] = await repoPayments.getPaymentsTypeByField({
      "payments_type.name": "subscription",
    });
    if (!paymentTypeField) {
      throw new Error("Payment type not found.");
    }

    const subscriptionsFields = await repoNMI.listNmiSubscriptionByField({
      "payments.company_id": companyID,
      "payments.payments_type": paymentTypeField.uuid_unique,
    });

    return subscriptionsFields;
  } catch (error) {
    throw new Error(error);
  }
};

const createSubscription = async (query, body) => {
  try {
    const { companyID, customerVaultId } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with ID ${companyID} not found.`);
    }

    const [nmiConfigStatus, nmiConfigKey] = await Promise.all([
      repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "NMI_STATUS",
      }),
      repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "NMI_API_KEY",
      }),
    ]);

    if (!nmiConfigStatus.length && !nmiConfigKey.length) {
      throw new Error(`NMI configuration not found for company ${companyID}.`);
    }

    const { data: isActivated } = [nmiConfigStatus];
    const { data: apiKey } = [nmiConfigKey];

    const [accountCardField] = await repoAccounts.getAccountCardByField({
      "accounts_cards.customer_vault_id": customerVaultId,
    });

    if (!accountCardField) {
      throw new Error("Account card not found.");
    }

    if (!isActivated || !apiKey) {
      throw new Error(
        `NMI is not activated or API key is missing for company ${companyID}.`
      );
    }

    const data = {
      recurring: "add_subscription",
      maxBodyLength: Infinity,
      security_key: apiKey,
      customer_vault_id: customerVaultId,
      ...body,
    };

    const response = await requestNMI(data, "POST", "api/transact.php");

    if (response.response_code == 100) {
      const [paymentProviderField] =
        await repoPayments.getPaymentsProviderByField({
          "payments_provider.name": "NMI",
        });

      if (!paymentProviderField) {
        throw new Error("Payment provider not found.");
      }

      const orderId = await getUniqueReference();

      const {
        currency,
        plan_amount,
        plan_payments,
        month_frequency,
        day_frequency,
        day_of_month,
      } = body;

      const [currencyField] = await repoUtils.getCurrenciesByField({
        "currencies.code": currency,
      });
      if (!currencyField) {
        throw new Error(`Currency code ${currency} not found.`);
      }

      const paymentData = {
        companyID,
        orderId,
        phone: accountCardField.phone,
        amount: plan_amount,
        currency: currency,
        transaction_type: "subscription",
      };

      const paymentField = await modelPayments.savePaymentsByProvider(
        paymentData,
        {
          providerID: paymentProviderField.uuid_unique,
          status: "pending",
          provider_response: null,
        }
      );

      if (!paymentField) {
        throw new Error("Payment not found.");
      }

      const result = await repoNMI.saveNmiSubscription({
        customer_vault_id: customerVaultId,
        subscription_id: response.subscription_id,
        plan_payments: plan_payments,
        plan_amount: plan_amount,
        month_frequency: month_frequency ? month_frequency : null,
        day_frequency: day_frequency ? day_frequency : null,
        day_of_month: day_of_month ? day_of_month : null,
        payment_id: paymentField.uuid_unique,
      });

      return result;
    } else {
      return response;
    }
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getTransactionalData,
  getPlanSubscription,
  listPlanSubscriptions,
  createSubscription,
};
