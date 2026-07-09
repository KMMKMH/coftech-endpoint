const modelSocial = require("../../models/social");
const repoBots = require("../../repositories/bots");

const getMessageByContactResolver = async (parent, args, context) => {
  try {
    const { companyID, botID } = context;
    const { id: contactID, networkID } = parent;
    const { page, limit, orderDirection } = args;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    const currentCompanyID =
      botField.company_id === companyID ? companyID : botField.company_id;

    const query = {
      contactID,
      botID,
      companyID: currentCompanyID,
      page,
      limit,
      orderDirection,
      networkID
    };

    const {
      result: items,
      currentPage,
      totalPages,
      totalMessages,
    } = await modelSocial.getMessages(query);

    return {
      items,
      totalPages,
      currentPage,
      totalMessages,
    };
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getMessageByContactResolver,
};
