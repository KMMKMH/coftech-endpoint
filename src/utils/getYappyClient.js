const repoCompany = require("../repositories/company");
const { YappyPaymentService } = require("./yappyService");

const getYappyClient = async (companyID, botID) => {
  const [yappyStatusConfig] = await repoCompany.getCompanyConfigByField({
    "company_configs.company_id": companyID,
    "company_configs.bot_id": botID,
    "configs_templates.owner_type": "extension",
    "configs_templates.key": "YAPPY_STATUS",
  });

  if (!yappyStatusConfig || yappyStatusConfig.data === "false") {
    throw new Error("Yappy is not enabled");
  }

  const [yappyApiKeyConfig] = await repoCompany.getCompanyConfigByField({
    "company_configs.company_id": companyID,
    "company_configs.bot_id": botID,
    "configs_templates.owner_type": "extension",
    "configs_templates.key": "YAPPY_API_KEY",
  });
  if (!yappyApiKeyConfig || yappyApiKeyConfig.data === "") {
    throw new Error("Yappy API key is not set");
  }

  const [yappyMerchantIdConfig] = await repoCompany.getCompanyConfigByField({
    "company_configs.company_id": companyID,
    "company_configs.bot_id": botID,
    "configs_templates.owner_type": "extension",
    "configs_templates.key": "YAPPY_MERCHANT_ID",
  });
  if (!yappyMerchantIdConfig || yappyMerchantIdConfig.data === "") {
    throw new Error("Yappy merchant ID is not set");
  }

  const [yappyUrlDomainConfig] = await repoCompany.getCompanyConfigByField({
    "company_configs.company_id": companyID,
    "company_configs.bot_id": botID,
    "configs_templates.owner_type": "extension",
    "configs_templates.key": "YAPPY_URL_DOMAIN",
  });

  if (!yappyUrlDomainConfig || yappyUrlDomainConfig.data === "") {
    throw new Error("Yappy URL domain is not set");
  }

  const merchantId = yappyMerchantIdConfig.data;
  const secretKey = yappyApiKeyConfig.data;
  const urlDomain = yappyUrlDomainConfig.data;

  const yappyClient = new YappyPaymentService({
    merchantId,
    secretKey,
    urlDomain,
  });

  return yappyClient;
};

module.exports = { getYappyClient };
