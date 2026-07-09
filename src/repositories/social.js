const logger = require("../utils/logger");
const { BaseRepository } = require("./base");

/**
 * Repository for social messages operations.
 * @class SocialMessagesRepository
 * @extends BaseRepository
 */
class SocialMessagesRepository extends BaseRepository {
  constructor() {
    super("social_messages");
  }

  /**
   * Retrieves messages filtered by `data` with pagination and ordering options.
   * Returns an object with `result`, `totalPages`, `currentPage` and `totalMessages`.
   *
   * @param {Object|string} data - Where conditions for the query (or raw SQL when `isRaw` is used).
   * @param {Object} [options]
   * @param {number|null} [options.page=1]
   * @param {number} [options.limit=10]
   * @param {string|null} [options.orderBy=null]
   * @param {string} [options.orderDirection=DESC]
   * @returns {Promise<{result: Array, totalPages: number, currentPage: number, totalMessages: number}>}
   * @throws {Error} If the query fails.
   */
  async getByField(
    data,
    options = {
      page: 1,
      limit: 10,
      orderBy: null,
      orderDirection: "DESC",
    }
  ) {
    try {
      const { query: baseQuery } = this._validateOptions(options);

      const {
        page = 1,
        limit = 10,
        orderDirection = "DESC",
        contact1 = false,
        contact2 = false,
      } = options;

      const query = baseQuery.client
        .queryBuilder()
        .from("vw_social_messages_final")
        .select(
          "vw_social_messages_final.uuid_unique AS message_id",
          "contact_sender.contact_id AS sender_number",
          "contact_sender.picture AS sender_picture",
          "vw_social_messages_final.body",
          "vw_social_messages_final.via",
          "contact_to_send.contact_id AS to_send",
          "contact_to_send.picture AS to_send_picture",
          "vw_social_messages_final.created_at",
          "vw_social_messages_final.type",
          "vw_social_messages_final.is_edited",
          "vw_social_messages_final.is_revoked",
          "vw_social_messages_final.caption",
          baseQuery.client.raw(
            "CAST(vw_social_messages_final.metadata AS JSON) AS metadata"
          ),
          "vw_social_messages_final.quoted_message_id"
        )
        .leftJoin(
          "social_contacts AS contact_sender",
          "vw_social_messages_final.sender",
          "contact_sender.contact_id"
        )
        .leftJoin(
          "social_contacts AS contact_to_send",
          "vw_social_messages_final.to_send",
          "contact_to_send.contact_id"
        )
        .where(data);

      if (contact1 && contact2) {
        query
          .andWhere(function () {
            this.where({
              "vw_social_messages_final.sender": contact1,
              "vw_social_messages_final.to_send": contact2,
            }).orWhere({
              "vw_social_messages_final.sender": contact2,
              "vw_social_messages_final.to_send": contact1,
            });
          })
          .andWhere("vw_social_messages_final.is_group", "<>", 1)
          .andWhere("vw_social_messages_final.is_broadcast", "<>", 1);
      }

      query
        .orderBy("vw_social_messages_final.id", orderDirection)
        .offset((page - 1) * limit)
        .limit(limit);

      const [result, totalCount] = await Promise.all([
        query,
        baseQuery.client
          .queryBuilder()
          .from("vw_social_messages_final")
          .count("id as total")
          .where(data)
          .andWhere(function () {
            if (contact1 && contact2) {
              this.where({
                "vw_social_messages_final.sender": contact1,
                "vw_social_messages_final.to_send": contact2,
              }).orWhere({
                "vw_social_messages_final.sender": contact2,
                "vw_social_messages_final.to_send": contact1,
              });
            }
          })
          .andWhere("vw_social_messages_final.is_group", "<>", 1)
          .andWhere("vw_social_messages_final.is_broadcast", "<>", 1)
          .first(),
      ]);

      const totalPages = Math.ceil(totalCount.total / limit);

      return {
        result: result,
        totalPages,
        currentPage: page,
        totalMessages: totalCount.total,
      };
    } catch (e) {
      logger.error(
        `Error getting message with data: ${JSON.stringify(
          data
        )}, error: ${JSON.stringify(e)}`
      );

      throw new Error(`Error getting message data`);
    }
  }

  /**
   * Retrieves the latest messages between two contacts for a specific bot.
   *
   * @param {string} contact1 - Identifier of the first contact (phone id).
   * @param {string} contact2 - Identifier of the second contact (phone id).
   * @param {string|number} botID - Identifier of the bot/client.
   * @param {number} [limit=5] - Maximum number of messages to return.
   * @param {Object} [options] - Additional options (e.g. `trx` for transactions).
   * @returns {Promise<Array>} Array of message objects.
   */
  async getLastConversationMessages(
    contact1,
    contact2,
    botID,
    limit = 5,
    options = {}
  ) {
    const { query: baseQuery } = this._validateOptions(options);

    const messages = await baseQuery.client
      .queryBuilder()
      .from("vw_social_messages_final")
      .select(
        "vw_social_messages_final.id",
        "vw_social_messages_final.uuid_unique",
        "vw_social_messages_final.message_id",
        "vw_social_messages_final.sender",
        "vw_social_messages_final.to_send",
        "vw_social_messages_final.body",
        "vw_social_messages_final.type",
        "vw_social_messages_final.via",
        "vw_social_messages_final.created_at",
        "vw_social_messages_final.caption",
        baseQuery.client.raw(
          "CAST(vw_social_messages_final.metadata AS JSON) AS metadata"
        ),
        baseQuery.client.raw(
          "UNIX_TIMESTAMP(vw_social_messages_final.created_at) AS timestamp"
        )
      )
      .where("vw_social_messages_final.client_id", "=", botID)
      .andWhere(function () {
        this.where({
          "vw_social_messages_final.sender": contact1,
          "vw_social_messages_final.to_send": contact2,
        }).orWhere({
          "vw_social_messages_final.sender": contact2,
          "vw_social_messages_final.to_send": contact1,
        });
      })
      .andWhere("vw_social_messages_final.is_group", "<>", 1)
      .andWhere("vw_social_messages_final.is_broadcast", "<>", 1)
      .andWhere("vw_social_messages_final.is_revoked", "=", 0)
      .whereIn("vw_social_messages_final.via", ["send", "receive"])
      .whereIn("vw_social_messages_final.type", [
        "text",
        "chat",
        "image",
        "audio",
        "ptt",
        "document",
        "location",
        "contact",
        "event_message",
      ])
      .orderBy("vw_social_messages_final.id", "DESC")
      .limit(limit)
      .catch((error) => {
        logger.error(
          `Error getting conversation messages between ${contact1} and ${contact2}: ${JSON.stringify(
            error
          )}`
        );
        throw new Error("Failed to fetch conversation messages");
      });

    return messages;
  }

  /**
   * Inserts or updates a record in the `social_messages` table and returns
   * the final representation from the `vw_social_messages_final` view based
   * on the event type provided in `options.event`.
   *
   * @param {Object} data - Data to insert into `social_messages`.
   * @param {Object} [options] - Additional options. May include `query` and `event`.
   * @param {string} [options.event='new_message'] - Event type: 'new_message'|'message_create'|'message_edit'|'message_revoke'.
   * @returns {Promise<Object>} Formatted message retrieved from the view.
   * @throws {Error} If the operation fails or the event is invalid.
   */
  async save(data, options = {}) {
    try {
      const { query } = this._validateOptions(options);
      this._validateNotEmpty(data, "data");
      const event = options.event || "new_message";

      const validEvents = [
        "new_message",
        "message_create",
        "message_edit",
        "message_revoked",
      ];
      if (!validEvents.includes(event)) {
        throw new Error(`Invalid event: ${event}`);
      }

      logger.info(
        `[${this.tableName}]: Saving with data: ${JSON.stringify(data)}`
      );

      const [id] = await query.insert(data);
      let response;

      const getRawMessageById = async (id) => {
        const { query: q } = this._validateOptions(options);
        const msg = await q.where({ "social_messages.id": id }).first();

        if (!msg) {
          logger.warn(`Message with id ${id} not found in social_messages`);
          return null;
        }
        return msg;
      };

      if (event === "new_message" || event === "message_create") {
        [response] = (
          await this.getByField({ "vw_social_messages_final.id": id }, options)
        ).result;
      } else if (event === "message_edit") {
        const field = await getRawMessageById(id);
        if (field) {
          [response] = (
            await this.getByField(
              {
                "vw_social_messages_final.message_id": field.edited_message_id,
              },
              options
            )
          ).result;

          if (!response) {
            logger.warn(
              `Original message not found for edit event, returning edited message instead`,
              {
                event,
                id,
                edited_message_id: field.edited_message_id,
                new_message_id: field.message_id,
              }
            );

            [response] = (
              await this.getByField(
                { "vw_social_messages_final.id": id },
                options
              )
            ).result;
          }
        }
      } else {
        const field = await getRawMessageById(id);

        if (field) {
          const parsedData = await JSON.parse(field.extra2);
          const revokedID = parsedData.revoked.message_id;
          [response] = (
            await this.getByField(
              {
                "vw_social_messages_final.message_id": revokedID,
              },
              options
            )
          ).result;

          if (!response) {
            logger.warn(
              `Original message not found for edit event, returning edited message instead`,
              {
                event,
                id,
                edited_message_id: field.edited_message_id,
                new_message_id: field.message_id,
              }
            );

            [response] = (
              await this.getByField(
                { "vw_social_messages_final.id": id },
                options
              )
            ).result;
          }
        }
      }

      logger.info(`Save response data: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      logger.error(
        `Error on "save" method of ${
          this.tableName
        } with data: ${JSON.stringify(data)}, error: ${JSON.stringify(error)}`
      );
      throw new Error(`Error saving ${this.tableName}`);
    }
  }
}

class SocialNetworksRepository extends BaseRepository {
  constructor() {
    super("social_networks");
  }

  async getByField(
    data,
    options = {
      page: 1,
      limit: 10,
      orderBy: null,
      orderDirection: "DESC",
    }
  ) {
    try {
      const { query: baseQuery, isRaw } = this._validateOptions(options);
      const includeProviders = options.includeProviders || true;

      let query = baseQuery.select(
        "social_networks.uuid_unique",
        "social_networks.name",
        "social_networks.key",
        "social_networks.status",
        "social_networks.created_at",
        "social_networks.updated_at",
        "social_networks.store_item_id",
        "social_networks.is_default"
      );

      if (includeProviders) {
        query = query
          .leftJoin(
            "social_networks_providers",
            "social_networks.uuid_unique",
            "social_networks_providers.social_network_id"
          )
          .select(
            baseQuery.client.raw(`
            CASE 
              WHEN COUNT(social_networks_providers.uuid_unique) > 0 
              THEN JSON_ARRAYAGG(
                JSON_OBJECT(
                  'uuid_unique', social_networks_providers.uuid_unique,
                  'key', social_networks_providers.key,
                  'name', social_networks_providers.name,
                  'description', social_networks_providers.description,
                  'is_required_configs', social_networks_providers.is_required_configs,
                  'is_default', social_networks_providers.is_default
                )
              )
              ELSE NULL
            END as providers
          `)
          )
          .groupBy(
            "social_networks.uuid_unique",
            "social_networks.name",
            "social_networks.key",
            "social_networks.status",
            "social_networks.created_at",
            "social_networks.updated_at",
            "social_networks.store_item_id",
            "social_networks.is_default"
          )
          .orderBy("social_networks.uuid_unique", "asc");
      } else {
        query = query.orderBy("social_networks.uuid_unique", "asc");
      }

      if (isRaw) {
        query = query.whereRaw(data);
      } else {
        query = query.where(data);
      }

      const rows = await query;

      if (includeProviders) {
        return rows.map((row) => ({
          ...row,
          providers: row.providers || null,
        }));
      }

      return rows;
    } catch (e) {
      logger.error(
        `Error getting network with data: ${JSON.stringify(
          data
        )} ${JSON.stringify(options)}, error: ${JSON.stringify(e)}`
      );
      throw new Error(`Error getting network data`);
    }
  }
}

class SocialContactsRepository extends BaseRepository {
  constructor() {
    super("social_contacts");
  }

  /**
   * Retrieves the list of contacts (senders) for a specific bot using a
   * subquery with `WITH senders AS (...)`. Returns pagination and metadata.
   *
   * @param {Object} params - Search parameters.
   * @param {string|number} params.botID - Bot/client ID.
   * @param {string} params.botPhone - Bot phone/identifier.
   * @param {string|null} [params.contactPhone=null] - Filter by specific contact number.
   * @param {number|null} [params.networkID=null] - Filter by network_id.
   * @param {number} [limit=10] - Page size.
   * @param {number} [page=1] - Page number.
   * @param {Object} [options] - Additional options (e.g. `trx` for transactions).
   * @returns {Promise<{result: Array, totalPages: number, currentPage: number, totalContacts: number}>}
   */
  async getContactsByBot(
    { botID, botPhone, contactPhone = null, networkID = null },
    limit = 10,
    page = 1,
    options = {}
  ) {
    try {
      const { query: baseQuery } = this._validateOptions(options);
      const senderSql = `
        WITH senders AS (
          SELECT sender,
                (SELECT network_id
                  FROM social_messages sm2
                  WHERE sm2.sender = sm.sender
                    AND sm2.client_id = ?
                    AND sm2.via = 'receive'
                  ORDER BY sm2.created_at DESC
                  LIMIT 1) as latest_network_id
          FROM social_messages sm
          WHERE client_id = ?
            AND via = 'receive'
            AND is_group <> 1
            AND is_broadcast <> 1
            ${contactPhone ? `AND sender = ?` : ""}
            ${networkID ? `AND network_id = ?` : ""}
          GROUP BY sender
          ORDER BY sender DESC
          LIMIT ?
          OFFSET ?
        )
        SELECT
          sc.contact_id,
          sc.metadata,
          sc.picture,
          sc.uuid_unique,
          sc.created_at,
          sc.updated_at,
          s.latest_network_id,
          ac.user_id,
          acc.uuid_unique AS assigned_user_id,
          acc.first_name AS assigned_user_first_name,
          acc.last_name AS assigned_user_last_name,
          acc.photo AS assigned_user_photo,
          ac.assigned_at as assigned_user_at,
          bl.phone IS NOT NULL AS is_blocked
        FROM social_contacts sc
        LEFT JOIN senders s ON s.sender = sc.contact_id
        LEFT JOIN assigned_chats ac ON ac.phone_number = sc.contact_id AND ac.bot_id = ?
        LEFT JOIN accounts acc ON acc.uuid_unique = ac.user_id
        LEFT JOIN blacklist bl ON bl.phone = sc.contact_id AND bl.bot_id = ?
        WHERE sc.contact_id IN (SELECT sender FROM senders)
      `;

      const temporalOptionsBindings = [botID, botID];
      if (contactPhone) temporalOptionsBindings.push(contactPhone);
      if (networkID) temporalOptionsBindings.push(networkID);
      const optionsBindings = [
        ...temporalOptionsBindings,
        limit,
        (page - 1) * limit,
        botID,
        botID,
      ];

      const query = baseQuery.client.raw(senderSql, optionsBindings);

      const totalContactSql = `
        SELECT COUNT(DISTINCT sc.id) AS total_contacts
        FROM social_contacts sc
        JOIN social_messages sm ON sc.contact_id = sm.sender
        WHERE sm.client_id = ?
        AND sm.is_group <> 1
        AND sm.is_broadcast <> 1
        AND sm.via = 'receive'
        ${contactPhone ? `AND sm.sender = ?` : ""}
        ${networkID ? `AND sm.network_id = ?` : ""};
      `;
      const totalContactBindings = [botID];
      if (contactPhone) totalContactBindings.push(contactPhone);
      if (networkID) totalContactBindings.push(networkID);

      const totalContactsQuery = baseQuery.client.raw(
        totalContactSql,
        totalContactBindings
      );

      const [result, totalContactsResult] = await Promise.all([
        query,
        totalContactsQuery,
      ]);

      const totalContacts = totalContactsResult.flat()[0].total_contacts;
      const totalPages = Math.ceil(totalContacts / limit);

      return {
        result: result[0].length > 0 ? result[0] : [],
        totalPages,
        currentPage: page,
        totalContacts,
      };
    } catch (error) {
      logger.error(
        `Error getting contacts by bot with botID: ${botID}, botPhone: ${botPhone}, limit: ${limit}, page: ${page}, error: ${error}`
      );
      throw new Error(`Error getting contacts by bot`);
    }
  }

  /**
   * Retrieves the latest contacts (from the `latest_contacts_message` view)
   * for a bot, with optional filters for `networkID` and `snProviderID`.
   *
   * @param {string|number} botID - Bot/client identifier.
   * @param {number} [limit=10] - Maximum number of results.
   * @param {number|null} [networkID=null] - Filter by network id.
   * @param {number|null} [snProviderID=null] - Filter by social network provider id.
   * @param {Object} [options] - Additional options (e.g. `trx` for transactions).
   * @returns {Promise<Array>} List of recent contacts.
   */
  async getLastContacts(
    botID,
    limit = 10,
    networkID = null,
    snProviderID = null,
    options = {}
  ) {
    try {
      const { query: baseQuery } = this._validateOptions(options);

      let queryStr = `
      SELECT lcm.contact_id, lcm.metadata, lcm.picture, lcm.contact_uuid
      FROM latest_contacts_message AS lcm
      LEFT JOIN blacklist bl ON bl.phone = lcm.contact_id AND bl.bot_id = lcm.client_id
      WHERE lcm.client_id = ? AND bl.phone IS NULL
    `;

      const bindings = [botID];

      if (networkID) {
        queryStr += ` AND lcm.network_id = ?`;
        bindings.push(networkID);
      }

      if (snProviderID) {
        queryStr += ` AND lcm.sn_provider_id = ?`;
        bindings.push(snProviderID);
      }

      queryStr += ` ORDER BY lcm.latest_message_time DESC LIMIT ?`;
      bindings.push(limit);

      const result = await baseQuery.client.raw(queryStr, bindings);

      return result[0].length > 0 ? result[0] : [];
    } catch (error) {
      logger.error(
        `Error getting last contacts with botID: ${botID}, limit: ${limit}, networkID: ${networkID}, snProviderID: ${snProviderID}, error: ${error}`
      );
      throw new Error(`Error getting last contacts`);
    }
  }

  /**
   * Retrieves social networks (`social_networks`) with an option to include
   * providers and to use `whereRaw` when `isRaw` is provided in options.
   *
   * @param {Object|string} data - Conditions for the query (or raw SQL when `isRaw`).
   * @param {Object} [options]
   * @param {boolean} [options.includeProviders=true] - Include aggregated providers in a `providers` field.
   * @param {boolean} [options.isRaw=false] - When true, `data` is used as a raw where clause.
   * @returns {Promise<Array>} Rows with networks and optionally a `providers` field.
   * @throws {Error} If the query fails.
   */
  /**
   * Retrieves contacts from `social_contacts` applying filters and pagination.
   *
   * @param {Object|string} data - Conditions for the query.
   * @param {Object} [options]
   * @param {number} [options.page] - Requested page.
   * @param {number} [options.limit] - Page size.
   * @param {string} [options.orderBy] - Field to order by.
   * @param {string} [options.orderDirection] - Order direction ('ASC'|'DESC').
   * @returns {Promise<{result: Array, totalPages: number, currentPage: number, totalContacts: number}>}
   */
  async getByField(
    data,
    options = {
      page: 1,
      limit: 10,
      orderBy: null,
      orderDirection: "DESC",
    }
  ) {
    try {
      const { query, isRaw } = this._validateOptions(options);
      isRaw ? query.whereRaw(data) : query.where(data);

      if (options.page && options.limit) {
        query.offset((options.page - 1) * options.limit).limit(options.limit);
      }

      if (options.orderBy && options.orderDirection) {
        query.orderBy(options.orderBy, options.orderDirection);
      }

      const queryCount = query.clone();
      queryCount.clear("order").clear("limit").clear("offset");

      const [result, totalCount] = await Promise.all([
        query,
        queryCount.count({ total: "id" }).first(),
      ]);

      const totalPages = Math.ceil(totalCount.total / (options.limit || 10));

      return {
        result: result.length > 0 ? result : [],
        totalPages,
        currentPage: options.page || 1,
        totalContacts: totalCount.total,
      };
    } catch (error) {
      logger.error(
        `Error on "getByField" method of ${
          this.tableName
        } with data: ${JSON.stringify(data)}, error: ${JSON.stringify(error)}`
      );
      throw new Error(`Error getting ${this.tableName}`);
    }
  }
}

class SocialNetworksProvidersRepository extends BaseRepository {
  constructor() {
    super("social_networks_providers");
  }
}

/**
 * Repository for social network providers operations.
 * @class SocialNetworksProvidersRepository
 * @extends BaseRepository
 */

class SocialMessagesQueueRepository extends BaseRepository {
  constructor() {
    super("social_messages_queue");
  }
  /**
   * Marks a queue item as processed (`processed = 1`).
   *
   * @param {string} uuid_unique - UUID of the message in the queue.
   * @returns {Promise<number|Object>} Update result.
   * @throws {Error} If the update fails.
   */
  async updateMessageQueueStatus(uuid_unique) {
    try {
      logger.info(`updateMessageQueueStatus: ${uuid_unique}`);

      return await this.update(
        { "social_messages_queue.uuid_unique": uuid_unique },
        { processed: 1 }
      );
    } catch (e) {
      logger.error(
        `Error updating message queue status with uuid_unique: ${uuid_unique} error: ${JSON.stringify(
          e
        )}`
      );
      throw new Error(`Error updating message queue status`);
    }
  }

  /**
   * Retrieves a grouped set of pending queue messages for a bot.
   * Returns concatenated groups (ids, uuid_uniques) and group metadata.
   *
   * @param {string|number} bot_id - Identifier of the bot.
   * @returns {Promise<Array>} Raw result of the grouped query.
   */
  async getMessageQueueList(bot_id, options = {}) {
    try {
      const { query: baseQuery } = this._validateOptions(options);
      const query = baseQuery.client.raw(
        `SELECT
    GROUP_CONCAT(id ORDER BY id ASC) AS ids,
    GROUP_CONCAT(uuid_unique ORDER BY id ASC) AS uuid_uniques,
    bot_id,
    network_id,
    sender,
    MIN(created_at) AS first_created_at,
    MAX(created_at) AS last_created_at,
    GROUP_CONCAT(message_type ORDER BY id ASC) AS message_types,
    processed
FROM (
    SELECT
        id,
        uuid_unique,
        bot_id,
        network_id,
        sender,
        created_at,
        message_type,
        processed,
        @grp := IF(message_type = 'chat' AND TIMESTAMPDIFF(SECOND, @prev, created_at) <= 5, @grp, @grp + 1) AS grp,
        @prev := IF(message_type = 'chat', created_at, @prev)
    FROM
        social_messages_queue,
        (SELECT @prev := NULL, @grp := 0) AS vars
    WHERE
        processed = 0
    AND bot_id = ?
    ORDER BY
        message_type = 'chat' DESC,
        created_at,
        id
) AS grouped
GROUP BY
    grp, bot_id, network_id, sender, processed
ORDER BY
    first_created_at
LIMIT 1;
`,
        [bot_id]
      );

      return query
        .then((result) => {
          return result[0].length > 0 ? result[0] : [];
        })
        .catch(() => {
          return [];
        });
    } catch (e) {
      logger.error(
        `Error getting social messages queue list for bot ${bot_id}, error: ${JSON.stringify(
          e
        )}`
      );
      throw new Error(`Error getting social messages queue list`);
    }
  }

  /**
   * Updates the `message` (JSON) field of an item in `social_messages_queue`.
   * Reads the current JSON, merges it with `jsonUpdates` and persists the result.
   *
   * @param {string} uuid - UUID of the queue item.
   * @param {Object} jsonUpdates - Changes to merge into the message JSON.
   * @returns {Promise<number|Object>} Result of the update operation.
   */
  async updateMessageQueueJsonField(uuid, jsonUpdates) {
    try {
      const [currentMessage] = await this.getByField({
        "social_messages_queue.uuid_unique": uuid,
      });

      if (!currentMessage) {
        throw new Error("Message queue not found");
      }

      const currentJsonMessage = JSON.parse(currentMessage.message);

      const updatedJsonMessage = {
        ...currentJsonMessage,
        ...jsonUpdates,
      };

      const result = await this.update(
        { "social_messages_queue.uuid_unique": uuid },
        { message: JSON.stringify(updatedJsonMessage) }
      );

      return result;
    } catch (e) {
      logger.error(
        `Error updating message queue JSON field with uuid: ${uuid}, updates: ${JSON.stringify(
          jsonUpdates
        )}, error: ${JSON.stringify(e)}`
      );
      throw new Error(`Error updating message queue JSON field`);
    }
  }

  /**
   * Finds messages in the queue whose `message->"$.id"` matches `messageId`.
   * Can be filtered by `direction` when provided.
   *
   * @param {string} messageId - Id inside the message JSON.
   * @param {string|number} botId - Identifier of the bot.
   * @param {string|null} [direction=null] - 'inbound'|'outbound' or null.
   * @returns {Promise<Array>} Found results (raw from getByField).
   */
  async findMessageByJsonId(messageId, botId, direction = null) {
    try {
      let whereClause = `message->>"$.id" = '${messageId}' AND bot_id = '${botId}'`;

      if (direction) {
        whereClause += ` AND direction = '${direction}'`;
      }

      const result = await this.getByField(whereClause, { isRaw: true });
      return result;
    } catch (e) {
      logger.error(
        `Error finding message by JSON ID: ${messageId}, botId: ${botId}, direction: ${direction}, error: ${JSON.stringify(
          e
        )}`
      );
      throw new Error(`Error finding message by JSON ID`);
    }
  }

  /**
   * Finds messages in the queue whose `message->"$.status"` matches `status`.
   *
   * @param {string|number} botId - Identifier of the bot.
   * @param {string} status - Expected status value inside the message JSON.
   * @returns {Promise<Array>} Found results.
   */
  async findMessageByStatus(botId, status) {
    try {
      const whereClause = `message->>"$.status" = '${status}' AND bot_id = '${botId}'`;
      const result = await this.getByField(whereClause, { isRaw: true });
      return result;
    } catch (e) {
      logger.error(
        `Error finding message by status: ${status}, botId: ${botId}, error: ${JSON.stringify(
          e
        )}`
      );
      throw new Error(`Error finding message by status`);
    }
  }

  /**
   * Checks if an inbound message with the given JSON id exists in the queue.
   *
   * @param {string} messageId - Id inside the message JSON.
   * @param {string|number} botId - Identifier of the bot.
   * @returns {Promise<boolean>} True if it exists, false otherwise or on error.
   */
  async checkInboundMessageExists(messageId, botId) {
    try {
      const [existingMessage] = await this.findMessageByJsonId(
        messageId,
        botId
      );
      return !!existingMessage;
    } catch (e) {
      logger.error(
        `Error checking inbound message existence: ${messageId}, botId: ${botId}, error: ${JSON.stringify(
          e
        )}`
      );
      return false;
    }
  }

  async updateMessageStatus(messageId, botId, newStatus, additionalData = {}) {
    try {
      /**
       * Finds the outbound message in the queue and updates its `message` JSON
       * with the provided `status` and additional data.
       */
      const [existingMessage] = await this.findMessageByJsonId(
        messageId,
        botId,
        "outbound"
      );

      if (!existingMessage) {
        throw new Error("Message not found");
      }

      const jsonUpdates = {
        status: newStatus,
        ...additionalData,
      };

      const result = await this.updateMessageQueueJsonField(
        existingMessage.uuid_unique,
        jsonUpdates
      );

      return result;
    } catch (e) {
      logger.error(
        `Error updating message status: ${messageId}, botId: ${botId}, status: ${newStatus}, error: ${JSON.stringify(
          e
        )}`
      );
      throw new Error(`Error updating message status`);
    }
  }
}

/**
 * Repository for the `latest_contacts_message` view/table.
 * Provides read-only access to the latest messages per contact.
 * @class LatestContactsMessageRepository
 * @extends BaseRepository
 */
class LatestContactsMessageRepository extends BaseRepository {
  constructor() {
    super("latest_contacts_message");
  }
}

module.exports = {
  socialMessagesRepository: new SocialMessagesRepository(),
  socialNetworksRepository: new SocialNetworksRepository(),
  socialNetworksProvidersRepository: new SocialNetworksProvidersRepository(),
  socialContactsRepository: new SocialContactsRepository(),
  socialMessagesQueueRepository: new SocialMessagesQueueRepository(),
  latestContactsMessageRepository: new LatestContactsMessageRepository(),
};
