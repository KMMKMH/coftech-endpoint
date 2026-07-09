const { BaseRepository } = require("./base");
const logger = require("../utils/logger");

class DashboardLogsRepository extends BaseRepository {
  constructor() {
    super("dashboard_logs");
  }

  /**
   * @param {Object} data - Search conditions
   * @param {Object} options - Extended options
   * @param {boolean} options.isRaw - If true, uses whereRaw
   * @param {number} options.page - Current page (default: 1)
   * @param {number} options.limit - Page size (default: 10)
   * @param {string} options.orderBy - Sort field (default: 'created_at')
   * @param {string} options.orderDirection - Direction (default: 'desc')
   * @param {Object} options.trx - Transaction
   * @returns {Promise<Object>} { items, total, page, pageSize, totalPages, orderBy, orderDirection }
   */
  async getByField(data, options = {}) {
    try {
      this._validateNotEmpty(data, "data");

      const { isRaw, query } = this._validateOptions(options);

      const page = options.page || 1;
      const pageSize = options.limit || 10;
      const orderBy = options.orderBy || "created_at";
      const orderDirection = options.orderDirection || "desc";

      const offset = (page - 1) * pageSize;

      const baseQuery = query.clone();

      this._applyCustomFilters(baseQuery, data, isRaw);

      const paginatedQuery = baseQuery
        .clone()
        .offset(offset)
        .limit(pageSize)
        .orderBy(orderBy, orderDirection);

      const countQuery = query.clone().count("* as count");

      this._applyCustomFilters(countQuery, data, isRaw);

      const [results, total] = await Promise.all([paginatedQuery, countQuery]);

      return {
        items: results,
        total: total[0].count,
        page,
        pageSize,
        totalPages: Math.ceil(total[0].count / pageSize),
        orderBy,
        orderDirection,
      };
    } catch (error) {
      logger.error(
        `Error retrieving action logs - data: ${JSON.stringify(data)}, isRaw: ${
          options.isRaw || false
        }, error: ${JSON.stringify(error)}`
      );
      throw new Error("Failed to retrieve action logs");
    }
  }

  _applyCustomFilters(query, data, isRaw) {
    if (isRaw) {
      query.whereRaw(data);
    } else if (typeof data === "object" && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "object" && value !== null) {
          if (value.botID) {
            query.whereRaw(
              "JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.bot.botID')) = ?",
              [value.botID]
            );
          }
          if (value.startDate) {
            query.where(key, ">=", value.startDate);
          }
          if (value.endDate) {
            query.where(key, "<=", value.endDate);
          }
        } else {
          query.where(key, value);
        }
      }
    } else {
      throw new Error("Invalid filter format for getByField");
    }
  }
}

module.exports = {
  repoDashLogs: new DashboardLogsRepository(),
};
