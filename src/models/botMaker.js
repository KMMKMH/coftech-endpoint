const repoCompany = require("../repositories/company");
const requestBotMaker = require("../utils/requestBotMaker");

const sendTriggerIntent = async (query, body) => {
  try {
    const { companyID } = query;

    const token = await validateCompanyAndToken(companyID);

    const { channelId, contactId, intentIdOrName, variables } = body;
    const data = {
      url: `/chats-actions/trigger-intent`,
      method: "POST",
      body: {
        chat: {
          channelId,
          contactId,
        },
        intentIdOrName,
        ...(variables && { variables }),
      },
      token,
    };

    return await requestBotMaker(data);
  } catch (error) {
    throw new Error(error);
  }
};

const validateCompanyAndToken = async (companyID) => {
  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });
  if (!companyField) {
    throw new Error(`Company not found`);
  }

  const [companyConfig] = await repoCompany.getCompanyConfigByField({
    "company_configs.company_id": companyID,
    "configs_templates.owner_type": "company",
    "configs_templates.key": "BOT_MAKER_ACCESS_TOKEN",
  });
  if (!companyConfig || !companyConfig.data) {
    throw new Error(
      `Bot Maker Access Token not found for company ${companyID}`
    );
  }

  return companyConfig.data;
};

module.exports = {
  validateCompanyAndToken,
  sendTriggerIntent,
};
