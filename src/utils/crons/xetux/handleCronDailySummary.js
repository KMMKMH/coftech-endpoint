const dayjs = require("dayjs");

const modelsNoco = require("../../../models/noco");
const modelsXetux = require("../../../models/xetux");
const modelsBots = require("../../../models/bots");

const repoCompany = require("../../../repositories/company");
const repoBots = require("../../../repositories/bots");

const handleCronDailySummary = async (data) => {
  try {
    const { company_id: companyID, bot_id: botID } = data;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company ID ${companyID} not found.`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot ID ${botID} not found.`);
    }

    const [xetuxStatusField] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "XETUX_STATUS",
    });
    if (!xetuxStatusField || xetuxStatusField.data != "true") {
      throw new Error(`Xetux configuration not found for company ${companyID}.`);
    }

    const [xetuxUrlField] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "XETUX_URL",
    });
    if (!xetuxUrlField || xetuxUrlField.data == "") {
      throw new Error(`Xetux URL configuration not found for company ${companyID}.`);
    }

    const [xetuxProjectIDField] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "XETUX_PROJECT_ID",
    });
    if (!xetuxProjectIDField || xetuxProjectIDField.data == "") {
      throw new Error(`Xetux Project ID configuration not found for company ${companyID}.`);
    }

    const [purchasesData, salesData, paysData] = await Promise.all([
      modelsNoco.cronSaveXetuxPurchaseFullData({
        ...data,
        xetuxURL: xetuxUrlField.data,
        projectID: xetuxProjectIDField.data,
      }),
      modelsNoco.cronSaveXetuxSalesFullData({
        ...data,
        xetuxURL: xetuxUrlField.data,
        projectID: xetuxProjectIDField.data,
      }),
      modelsNoco.cronSaveXetuxSalesPayData({
        ...data,
        xetuxURL: xetuxUrlField.data,
        projectID: xetuxProjectIDField.data,
      }),
    ]);

    const filteredSales = modelsXetux.transformSales(salesData, paysData);
    const filteredPurchases = modelsXetux.transformPurchases(purchasesData);

    const mostUsedPaymentMethod = Object.entries(filteredSales.paymentMethodCounts).reduce(
      (max, current) => (current[1] > max[1] ? current : max), ["", 0]
    )[0];

    const date = (Object.keys(filteredSales.totalOrdersPerDay))[0];

    const balanceSummary = {
      datetime_long: dayjs(date).valueOf(),
      datetime_string: date,
      sales_orders: filteredSales.totals.orders,
      sales_amount: filteredSales.totals.amount,
      sales_amount_net: filteredSales.totals.net,
      sales_tax: filteredSales.totals.tax,
      sales_most_used_payment: mostUsedPaymentMethod,
      purchases_orders: filteredPurchases.totals.purchases,
      purchases_amount: filteredPurchases.totals.amount,
      purchases_amount_net: filteredPurchases.totals.net,
    };

    const message =`Here is your business summary for (*${date}*):

      Sales count: *${balanceSummary.sales_orders}*
      Total revenue: *${parseFloat(balanceSummary.sales_amount).toFixed(2)} USD*
      Net revenue: *${parseFloat(balanceSummary.sales_amount_net).toFixed(2)} USD*
      Taxes: *${parseFloat(balanceSummary.sales_tax).toFixed(2)} USD*
      Most used payment method: *${mostUsedPaymentMethod}*

      Branch purchase count: *${balanceSummary.purchases_orders}*
      Branch expenses: *${parseFloat(balanceSummary.purchases_amount).toFixed(2)} USD*
      Net branch expenses: *${parseFloat(balanceSummary.purchases_amount_net).toFixed(2)} USD*`      .split("\n")
      .map(s => s.trim())
      .join("\n");

    await modelsNoco.cronSaveXetuxSummaryData({ ...data, projectID: xetuxProjectIDField.data }, balanceSummary);
    
    await modelsBots.sendWhitelistMessagesBot({ botID }, {
      message,
    });
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = { handleCronDailySummary };