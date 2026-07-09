const repoBots = require("../../repositories/bots");
const { socialContactsRepository } = require("../../repositories/social");
const modelBots = require("../../models/bots");

const getBots = async (parent, args, context) => {
  try {
    const { user, phone, companyID } = { ...context, ...args, ...parent };

    const identifier = phone?.replace(/\D/g, "");

    const bots = await modelBots.listBots({
      ...(identifier && { identifier }),
      ...(companyID && { company_id: companyID }),
      user,
    });

    if (!bots.length) {
      throw new Error(`Bot not found for company ID ${companyID}`);
    }

    const pickedBot = bots.map((bot) => {
      return {
        id: bot.uuid_unique,
        name: bot.name,
        planID: bot.plan_id,
        phone: bot.identifier,
        types: bot.types,
        status: bot.status,
        suspended: bot.suspended,
        created_at: bot.created_at,
        updated_at: bot.updated_at,
        network: bot.network_name,
        companyID: bot.company_id,
      };
    });

    return pickedBot;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getBotsExtensions = async (parent, args) => {
  try {
    const { id: botID } = parent;
    const { id, is_active } = args;

    let extensions;
    if (id || typeof is_active !== "undefined") {
      extensions = await repoBots.getBotsExtensionsByField({
        ...(id && { "vbe.extension_id": id }),
        ...(botID && { "vbe.bot_id": botID }),
        ...(typeof is_active !== "undefined" && {
          "vbe.status": is_active,
        }),
      });
    } else {
      extensions = await repoBots.getBotsExtensionsByField({
        "vbe.bot_id": botID,
      });
    }

    const pickedExtensions = extensions.map((extension) => {
      return {
        id: extension.extension,
        name: extension.extension_name,
        key: extension.extension_key,
        is_active: extension.status,
      };
    });

    return pickedExtensions;
  } catch (error) {
    throw new Error(error);
  }
};

const getBotsContacts = async (parent, args) => {
  try {
    const { id: botID } = parent;
    const { phone: contactPhone, networkID, limit, page } = args;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error("Bot not found");
    }

    const { identifier: botPhone } = botField;

    const { result, totalContacts, totalPages, currentPage } =
      await socialContactsRepository.getContactsByBot(
        { botID, botPhone, contactPhone: contactPhone || null, networkID },
        limit,
        page
      );

    const pickedContacts = result.map((contact) => {
      return {
        id: contact.uuid_unique,
        name: contact.metadata?.general?.name,
        phone: contact.contact_id,
        photo: contact.picture,
        networkID: contact.latest_network_id,
        assigned_user: contact.assigned_user_id
          ? {
            id: contact.assigned_user_id,
            first_name: contact.assigned_user_first_name,
            last_name: contact.assigned_user_last_name,
            photo: contact.assigned_user_photo,
            assigned_at: contact.assigned_user_at,
          }
          : null,
        isBlocked: !!contact.is_blocked,
        created_at: contact.created_at,
        updated_at: contact.updated_at,
      };
    });

    return {
      items: pickedContacts,
      totalPages,
      currentPage,
      totalContacts,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const getLastContacts = async (parent, args) => {
  try {
    const { id: botID } = parent;
    const { limit, networkID, snProviderID } = args;

    const lastContacts = await socialContactsRepository.getLastContacts(
      botID,
      limit,
      networkID,
      snProviderID
    );

    const pickedLastContacts = lastContacts.map((contact) => ({
      id: contact.contact_uuid,
      name: contact.metadata?.general?.name,
      metadata: contact.metadata?.general,
      phone: contact.contact_id,
      photo: contact.picture,
    }));

    return pickedLastContacts;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getBots,
  getBotsExtensions,
  getBotsContacts,
  getLastContacts,
};
