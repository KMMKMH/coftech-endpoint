const db = require("../utils/db");
const logger = require("../utils/logger");

const getBotsByField = async (data, isRaw = false) => {
  try {
    const query = db("bots")
      .select(
        "bots.*",
        "social_networks.name as network_name",
        "social_networks.key as network_key",
        "social_networks.uuid_unique as network_id",
        "social_networks_providers.name as provider_name",
        "social_networks_providers.key as provider_key",
        "social_networks_providers.uuid_unique as provider_id",
        "social_networks_providers.is_required_configs as provider_is_required_configs"
      )
      .leftJoin(
        "bot_social_network_activations",
        "bot_social_network_activations.bot_id",
        "bots.uuid_unique"
      )
      .leftJoin(
        "social_networks",
        "social_networks.uuid_unique",
        "bot_social_network_activations.social_network_id"
      )
      .leftJoin(
        "social_networks_providers",
        "social_networks_providers.uuid_unique",
        "bot_social_network_activations.sn_provider_id"
      );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting bots with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting bots data`);
  }
};

const getFlexibleSummary = async ({ bot_id, type = "DAILY", fromDate }) => {
  try {
    const query = db("bot_summary").where("bot_id", bot_id);

    if (type === "MONTHLY") {
      if (fromDate) {
        const yearMonth = fromDate.slice(0, 7);
        query.whereRaw(`DATE_FORMAT(message_date, '%Y-%m') = ?`, [yearMonth]);
      }

      query
        .select(
          "bot_id",
          db.raw(`DATE_FORMAT(message_date, '%Y-%m') as message_date`),
          db.raw("SUM(total_messages) as total_messages"),
          db.raw("SUM(total_senders) as total_senders")
        )
        .groupBy("bot_id")
        .groupByRaw(`DATE_FORMAT(message_date, '%Y-%m')`)
        .orderBy("message_date", "desc");
    } else {
      if (fromDate) {
        query.andWhere("message_date", "=", fromDate);
      }

      query.select("*").orderBy("message_date", "desc");
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting flexible summary with bot_id: ${bot_id}, type: ${type}, fromDate: ${fromDate}, error: ${JSON.stringify(
        error
      )}`
    );
    throw new Error(`Error getting bot summary`);
  }
};

const getSummary = async ({ bot_id, type = "DAILY", date }) => {
  const validTypes = ["DAILY", "RANGE"];

  try {
    const query = db("bot_summary").where("bot_id", bot_id);

    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}`);
    }

    if (type === "RANGE") {
      if (!date || !date.from || !date.to) {
        throw new Error(`Invalid date range: ${JSON.stringify(date)}`);
      }

      query.whereBetween("message_date", [date.from, date.to]);
    }

    if (type === "DAILY") {
      if (date) {
        query.where("message_date", "=", date);
      }
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting summary with bot_id: ${bot_id}, type: ${type}, date: ${
        type === "RANGE" ? date.from : date
      }, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting bot summary`);
  }
};

const getSummaryMessages = async ({
  bot_id,
  date,
  timezone,
  type = "DAILY",
}) => {
  try {
    const baseQuery = db("vw_social_messages_final").where({
      "vw_social_messages_final.client_id": bot_id,
      "vw_social_messages_final.type": "text",
      "vw_social_messages_final.via": "receive",
      "vw_social_messages_final.is_broadcast": 0,
      "vw_social_messages_final.is_revoked": 0,
      "vw_social_messages_final.is_group": 0,
    });

    if (type === "DAILY" && date && typeof date === "string") {
      baseQuery.whereRaw("DATE(CONVERT_TZ(created_at, 'UTC', ?)) = ?", [
        timezone,
        date,
      ]);
    } else if (type === "RANGE") {
      baseQuery.whereRaw("CONVERT_TZ(created_at, 'UTC', ?) BETWEEN ? AND ?", [
        timezone,
        date.from,
        date.to,
      ]);
    }

    const [messages, metrics] = await Promise.all([
      baseQuery
        .clone()
        .select(
          "vw_social_messages_final.body",
          "vw_social_messages_final.created_at"
        )
        .orderBy("created_at", "desc"),
      baseQuery
        .clone()
        .first(
          db.raw("COUNT(DISTINCT sender) as total_unique"),
          db.raw(
            "COUNT(DISTINCT CONCAT(sender, '-', DATE(CONVERT_TZ(created_at, 'UTC', ?)))) as total_daily",
            [timezone]
          )
        ),
    ]);

    return {
      messages: messages || [],
      total_unique_participants: metrics?.total_unique || 0,
      total_daily_participants: metrics?.total_daily || 0,
    };
  } catch (error) {
    logger.error(
      `Error getting summary messages with bot_id: ${bot_id}, type: ${type}, date: ${date}, error: ${JSON.stringify(
        error
      )}`
    );
    throw new Error(`Error getting bot summary messages`);
  }
};

const getSimpleBotsExtensionsByField = async (data, isRaw = false) => {
  try {
    const query = db("extra_bots_extensions").select(
      "id",
      "uuid_unique",
      "bot_id",
      "extension_id",
      "store_logs_id",
      "status"
    );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting extra_bots_extensions with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting extra_bots_extensions data`);
  }
};

const getBotsExtensionsByField = async (data, isRaw = false) => {
  try {
    await db.raw("SET SESSION group_concat_max_len = 10000000");

    const query = db("v_bots_extensions as vbe")
      .select(
        "vbe.id AS id",
        "vbe.uuid_unique AS uuid_unique",
        "vbe.bot_id AS bot_id",
        "vbe.extension_id AS extension",
        "vbe.status AS status",
        "ve.name AS extension_name",
        "ve.key AS extension_key",
        "ve.icon AS extension_icon",
        "ve.description AS extension_description",
        "ve.category_id AS extension_category_id",
        "ve.category_name AS extension_category_name",
        "ve.category_unique AS extension_category_unique",
        "ve.category_dynamic AS extension_category_dynamic",
        "ve.extension_image AS extension_image",
        db.raw("JSON_ARRAYAGG(IFNULL(ct.key, 'null')) AS config_keys"),
        db.raw("JSON_ARRAYAGG(IFNULL(ct.name, 'null')) AS config_names"),
        db.raw(
          "JSON_ARRAYAGG(IFNULL(ct.description, 'null')) AS config_descriptions"
        ),
        db.raw("JSON_ARRAYAGG(IFNULL(cc.data, 'null')) AS config_datas"),
        db.raw(
          "JSON_ARRAYAGG(IFNULL(ct.data_type, 'null')) AS config_data_types"
        ),
        db.raw(
          "JSON_ARRAYAGG(IFNULL(ct.data_options, 'null')) AS config_data_options"
        )
      )
      .innerJoin("v_extensions as ve", "ve.uuid_unique", "vbe.extension_id")
      .leftJoin(
        "configs_templates as ct",
        "vbe.extension_id",
        "ct.extension_id"
      )
      .leftJoin("company_configs as cc", function () {
        this.on("cc.config_template_id", "=", "ct.uuid_unique")
          .andOn("cc.bot_id", "=", "vbe.bot_id")
          .andOn("cc.company_id", "=", "vbe.company_id");
      })
      .where("ct.internal", "!=", 1)
      .groupBy(
        "vbe.uuid_unique",
        "vbe.bot_id",
        "vbe.company_id",
        "vbe.extension_id",
        "vbe.status"
      );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return await query;
  } catch (e) {
    logger.error(
      `Error getting extra_bots_extensions with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );

    throw new Error(`Error getting extra_bots_extensions data`);
  }
};

const saveBot = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    const response = await db("bots").insert(data);
    return await getBotsByField({ "bots.id": response[0] });
  } catch (e) {
    throw new Error(`Error saving bots: ${e}`);
  }
};

const updateBot = async (where, data) => {
  try {
    return await db("bots").where(where).update(data);
  } catch (error) {
    throw new Error(`Error updating bot: ${error}`);
  }
};

const saveBotExtensionByField = async (data) => {
  try {
    logger.info(
      `Save extra_bots_extensions with data: ${JSON.stringify(data)}`
    );
    const response = await db("extra_bots_extensions").insert(data);
    const [newBotExtension] = await getSimpleBotsExtensionsByField({
      "extra_bots_extensions.id": response[0],
    });

    return await getBotsExtensionsByField({
      "vbe.uuid_unique": newBotExtension.uuid_unique,
    });
  } catch (e) {
    logger.error(
      `Error saving extra_bots_extensions with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving extra_bots_extensions: ${e}`);
  }
};

const updateBotExtension = async (where, data) => {
  try {
    logger.info(
      `updateBotExtension where: ${where} with data: ${JSON.stringify(data)}`
    );
    return await db("extra_bots_extensions").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating bot_extension with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error updating bot extension: ${error}`);
  }
};

const deleteBotExtension = async (data) => {
  try {
    logger.info(`Deleting BotExtension with data: ${JSON.stringify(data)}`);
    return await db("extra_bots_extensions").where(data).del();
  } catch (error) {
    logger.error(
      `Error deleting BotExtension with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error deleting BotExtension data`);
  }
};

const getBotsRefreshTokenByField = async (data, isRaw = false) => {
  try {
    const query = db("bots_refresh_tokens");
    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting bots_refresh_tokens with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting bots_refresh_tokens`);
  }
};

const saveBotsRefreshToken = async (data) => {
  try {
    logger.info(`saveBotsRefreshToken with data: ${JSON.stringify(data)}`);
    const [refreshTokenBotID] = await db("bots_refresh_tokens").insert(data);
    return refreshTokenBotID
      ? (
        await getBotsRefreshTokenByField({
          "bots_refresh_tokens.id": refreshTokenBotID,
        })
      )[0]
      : null;
  } catch (error) {
    logger.error(
      `Error saving bots_refresh_tokens with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error saving bots_refresh_tokens`);
  }
};

const updateBotsRefreshToken = async (where, data) => {
  try {
    logger.info(
      `updateBotsRefreshToken where: ${JSON.stringify(
        where
      )} with data: ${JSON.stringify(data)}`
    );
    return await db("bots_refresh_tokens").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating bots_refresh_tokens with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error updating bots_refresh_tokens`);
  }
};

const deleteBotsRefreshToken = async (data) => {
  try {
    logger.info(
      `Deleting bots_refresh_tokens with data: ${JSON.stringify(data)}`
    );
    return await db("bots_refresh_tokens").where(data).del();
  } catch (error) {
    logger.error(
      `Error deleting bots_refresh_tokens with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error deleting bots_refresh_tokens`);
  }
};

const getBotUsedTokensByField = async (data, isRaw = false) => {
  try {
    const query = db("completions_usages")
      .select(
        "completions_usages.company_id",
        "completions_usages.bot_id",
        "completions_usages.date"
      )
      .sum("tokens as tokens")
      .sum("credits as credits")
      .groupBy("completions_usages.date", "completions_usages.bot_id");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    throw new Error(`Error getting company used tokens: ${error}`);
  }
};

const saveBotUsedTokens = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;
    logger.info(`saveBotUsedTokens with data: ${JSON.stringify(data)}`);

    const [companyId] = await db("completions_usages").insert(data);
    const response = companyId
      ? (
        await getBotUsedTokensByField({
          "completions_usages.id": companyId,
        })
      )[0]
      : false;

    logger.info(`saveBotUsedTokens response data: ${JSON.stringify(response)}`);
    return response;
  } catch (e) {
    logger.error(
      `Error saving bot used tokens data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving bot used tokens`);
  }
};

const saveAssignedChat = async (data) => {
  try {
    logger.info(`saveAssignedChat with data: ${JSON.stringify(data)}`);
    const [assignedChatID] = await db("assigned_chats").insert(data);
    return assignedChatID
      ? (
        await getAssignedChatByField({ "assigned_chats.id": assignedChatID })
      )[0]
      : false;
  } catch (e) {
    logger.error(
      `Error saving assigned chat with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    logger.error(
      `Error saving assigned chat with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving assigned chat: ${e}`);
  }
};

const getAssignedChatByField = async (data, isRaw = false) => {
  try {
    const query = db("assigned_chats")
      .select("assigned_chats.*")
      .select("accounts.first_name as account_first_name")
      .select("accounts.last_name as account_last_name")
      .select("accounts.email as account_email")
      .select("accounts.phone as account_phone")
      .select("accounts.photo as account_photo")
      .leftJoin("accounts", "accounts.uuid_unique", "assigned_chats.user_id");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    throw new Error(`Error getting assigned chat: ${error}`);
  }
};

const updateAssignedChat = async (where, data) => {
  try {
    logger.info(
      `updateAssignedChat where: ${JSON.stringify(
        where
      )} with data: ${JSON.stringify(data)}`
    );
    return await db("assigned_chats").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating assigned chat with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error updating assigned chat`);
  }
};

const deleteAssignedChatByField = async (data) => {
  try {
    logger.info(`deleteAssignedChat with data: ${JSON.stringify(data)}`);
    return await db("assigned_chats").where(data).del();
  } catch (error) {
    logger.error(
      `Error deleting assigned chat with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error deleting assigned chat`);
  }
};

const getBotSocialNetworkActivations = async (data, isRaw = false) => {
  try {
    const query = db("bot_social_network_activations")
      .leftJoin(
        "social_networks",
        "bot_social_network_activations.social_network_id",
        "social_networks.uuid_unique"
      )
      .leftJoin(
        "social_networks_providers",
        "bot_social_network_activations.sn_provider_id",
        "social_networks_providers.uuid_unique"
      )
      .select(
        "bot_social_network_activations.*",
        "social_networks.name as network_name",
        "social_networks.key as network_key",
        "social_networks.is_default as network_is_default",
        "social_networks_providers.name as provider_name",
        "social_networks_providers.key as provider_key",
        "social_networks_providers.description as provider_description",
        "social_networks_providers.is_required_configs as provider_is_required_configs",
        "social_networks_providers.is_default as provider_is_default"
      );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    const result = await query;
    return result.length > 0 ? result : [];
  } catch (e) {
    logger.error(
      `Error getting bots activations with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting bots activations data`);
  }
};

const updateBotSocialNetworkActivation = async (where, data) => {
  try {
    logger.info(
      `updateBotSocialNetworkActivation where: ${JSON.stringify(
        where
      )} with data: ${JSON.stringify(data)}`
    );
    return await db("bot_social_network_activations").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating bot_social_network_activations with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error updating bot activation`);
  }
};

const saveBotSocialNetworkActivation = async (data) => {
  try {
    logger.info(
      `saveBotSocialNetworkActivation with data: ${JSON.stringify(data)}`
    );
    return await db("bot_social_network_activations").insert(data);
  } catch (error) {
    logger.error(
      `Error saving bot_social_network_activations with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error saving bot activation`);
  }
};

const getProviderByField = async (data, isRaw = false) => {
  try {
    const query = db("social_networks_providers");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting providers with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting providers data`);
  }
};

const getBotSocialNetworkActivationsWithConfigs = async (
  data,
  isRaw = false
) => {
  try {
    const query = db("bot_social_network_activations")
      .leftJoin(
        "social_networks",
        "bot_social_network_activations.social_network_id",
        "social_networks.uuid_unique"
      )
      .leftJoin(
        "social_networks_providers",
        "bot_social_network_activations.sn_provider_id",
        "social_networks_providers.uuid_unique"
      )
      .leftJoin(
        "configs_templates",
        "configs_templates.sn_provider_id",
        "social_networks_providers.uuid_unique"
      )
      .leftJoin("company_configs", function () {
        this.on(
          "company_configs.config_template_id",
          "=",
          "configs_templates.uuid_unique"
        ).andOn(
          "company_configs.bot_id",
          "=",
          "bot_social_network_activations.bot_id"
        );
      })
      .select(
        "bot_social_network_activations.*",
        "social_networks.name as network_name",
        "social_networks.key as network_key",
        "social_networks.is_default as network_is_default",
        "social_networks_providers.name as provider_name",
        "social_networks_providers.key as provider_key",
        "social_networks_providers.description as provider_description",
        "social_networks_providers.is_required_configs as provider_is_required_configs",
        "social_networks_providers.is_default as provider_is_default",
        db.raw(`CASE 
          WHEN COUNT(company_configs.uuid_unique) > 0 
          THEN JSON_ARRAYAGG(
            JSON_OBJECT(
              'company_config_id', company_configs.uuid_unique,
              'template_id', configs_templates.uuid_unique,
              'key', configs_templates.key,
              'data_type', configs_templates.data_type,
              'description', configs_templates.description,
              'data', company_configs.data,
              'internal', configs_templates.internal
            )
          )
          ELSE NULL
        END as provider_configs`)
      )
      .groupBy(
        "bot_social_network_activations.uuid_unique",
        "social_networks.uuid_unique",
        "social_networks_providers.uuid_unique"
      );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    const result = await query;

    return result.length > 0 ? result : [];
  } catch (e) {
    logger.error(
      `Error getting bots activations with configs with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting bots activations with configs data`);
  }
};

const getBotActiveHoursByField = async ({ botID, startDate, endDate, page = 1, pageSize = 10 }) => {
  try {
    const offset = (page - 1) * pageSize;

    const query = db("bot_active_hours_daily")
      .select("*")
      .where("bot_id", botID)
      .orderBy("date", "desc")
      .limit(pageSize)
      .offset(offset);

    if (endDate) {
      query.whereBetween("date", [startDate, endDate]);
    } else {
      query.where("date", startDate);
    }

    const countQuery = db("bot_active_hours_daily")
      .count("* as total")
      .where("bot_id", botID);

    if (endDate) {
      countQuery.whereBetween("date", [startDate, endDate]);
    } else {
      countQuery.where("date", startDate);
    }

    const [{ total }] = await countQuery;
    const result = await query;

    return {
      items: result,
      total: parseInt(total),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error(
      `Error getting bot active hours with botID: ${botID}, startDate: ${startDate}, endDate: ${endDate}, page: ${page}, limit: ${pageSize}, error: ${JSON.stringify(
        error
      )}`
    );
    throw new Error(`Error getting bot active hours data`);
  }
};

module.exports = {
  getBotsByField,
  getBotsExtensionsByField,
  getSimpleBotsExtensionsByField,
  saveBot,
  updateBot,
  saveBotExtensionByField,
  updateBotExtension,
  deleteBotExtension,
  getBotsRefreshTokenByField,
  saveBotsRefreshToken,
  updateBotsRefreshToken,
  deleteBotsRefreshToken,
  getFlexibleSummary,
  getSummary,
  getSummaryMessages,
  getBotUsedTokensByField,
  saveBotUsedTokens,
  saveAssignedChat,
  getAssignedChatByField,
  updateAssignedChat,
  deleteAssignedChatByField,
  getBotSocialNetworkActivations,
  updateBotSocialNetworkActivation,
  saveBotSocialNetworkActivation,
  getProviderByField,
  getBotSocialNetworkActivationsWithConfigs,
  getBotActiveHoursByField,
};
