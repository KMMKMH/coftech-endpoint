const db = require("../utils/db");
const logger = require("../utils/logger");

/**
 * @class BaseRepository
 * @description Provides basic CRUD operations for a single database table.
 * @property {string} tableName - The name of the database table.
 */
class BaseRepository {
  /**
   * Creates an instance of BaseRepository.
   * @param {string} tableName - The name of the database table this repository interacts with.
   */
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Gets the table name associated with this repository.
   * @returns {string} The table name.
   */
  getTableName() {
    return this.tableName;
  }

  /**
   * Validates and processes the options object for query building.
   * @protected
   * @param {object} [options={}] - Options for the query.
   * @param {object} [options.trx] - Knex transaction object.
   * @param {boolean} [options.isRaw=false] - Whether to use raw SQL conditions.
   * @returns {{isRaw: boolean, trx: (object|undefined), query: import('knex').Knex.QueryBuilder}} The validated options and the Knex query builder instance.
   * @throws {Error} If the transaction object is invalid.
   */
  _validateOptions(options = {}) {
    const { trx, isRaw = false } = options;

    if (
      trx &&
      (
        (typeof trx !== "object" && typeof trx !== "function") ||
        typeof trx.commit !== "function"
      )
    ) {
      throw new Error("Invalid transaction");
    }

    return {
      isRaw,
      trx,
      query: trx ? trx(this.tableName) : db(this.tableName),
    };
  }

  /**
   * Validates that an object is not empty.
   * @protected
   * @param {object} object - The object to validate.
   * @param {string} [fieldName="Object"] - The name of the field to use in the error message.
   * @throws {Error} If the object is empty or null/undefined.
   */
  _validateNotEmpty(object, fieldName = "Object") {
    if (!object || Object.keys(object).length === 0) {
      throw new Error(`${fieldName} cannot be empty`);
    }
  }

  /**
   * Retrieves records from the table based on specified field criteria.
   * @async
   * @param {object|string} data - The criteria for the WHERE clause. If `options.isRaw` is true, this should be a raw SQL string. Otherwise, it's an object of key-value pairs.
   * @param {object} [options={}] - Options for the query, including transaction and raw status.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of matching records, or an empty array if none are found.
   * @throws {Error} If there is a database error during retrieval.
   */
  async getByField(
    data,
    options = {
      page: null,
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

      const res = await query;
      return res.length > 0 ? res : [];
    } catch (error) {
      logger.error(
        `Error on "getByField" method of ${
          this.tableName
        } with data: ${JSON.stringify(data)}, error: ${JSON.stringify(error)}`
      );
      throw new Error(`Error getting ${this.tableName}`);
    }
  }

  /**
   * Inserts a new record into the table and retrieves the full new record.
   * @async
   * @param {object} data - The data to be inserted.
   * @param {object} [options={}] - Options for the query, including transaction.
   * @returns {Promise<object|boolean>} A promise that resolves to the saved record object (including its generated ID), or `false` if the insertion fails to return an ID.
   * @throws {Error} If the data is empty or there is a database error during saving.
   */
  async save(data, options = {}) {
    try {
      const { query } = this._validateOptions(options);
      this._validateNotEmpty(data, "data");

      logger.info(
        `[${this.tableName}]: Saving with data: ${JSON.stringify(data)}`
      );

      const [id] = await query.insert(data);
      return id
        ? (await this.getByField({ [`${this.tableName}.id`]: id }, options))[0]
        : false;
    } catch (error) {
      logger.error(
        `Error on "save" method of ${
          this.tableName
        } with data: ${JSON.stringify(data)}, error: ${JSON.stringify(error)}`
      );
      throw new Error(`Error saving ${this.tableName}`);
    }
  }

  /**
   * Updates records in the table that match the `where` criteria with the new `data`.
   * @async
   * @param {object} where - The criteria for selecting the records to update (WHERE clause).
   * @param {object} data - The data to update.
   * @param {object} [options={}] - Options for the query, including transaction.
   * @returns {Promise<number>} A promise that resolves to the number of rows updated.
   * @throws {Error} If the update data is empty or there is a database error during update.
   */
  async update(where, data, options = {}) {
    try {
      const { query } = this._validateOptions(options);
      this._validateNotEmpty(where, "where");
      this._validateNotEmpty(data, "data");

      logger.info(
        `[${this.tableName}]: Updating with data: ${JSON.stringify(data)}`
      );

      return await query.where(where).update(data);
    } catch (error) {
      logger.error(
        `Error on "update" method of ${
          this.tableName
        } with data: ${JSON.stringify(data)}, error: ${JSON.stringify(error)}`
      );
      throw new Error(`Error updating ${this.tableName}`);
    }
  }

  /**
   * Deletes records from the table that match the `where` criteria.
   * @async
   * @param {object} where - The criteria for selecting the records to delete (WHERE clause).
   * @param {object} [options={}] - Options for the query, including transaction.
   * @returns {Promise<number>} A promise that resolves to the number of rows deleted.
   * @throws {Error} If there is a database error during deletion.
   */
  async delete(where, options = {}) {
    try {
      logger.info(
        `[${this.tableName}]: Deleting with data: ${JSON.stringify(where)}`
      );

      const { query } = this._validateOptions(options);
      this._validateNotEmpty(where, "where");
      return await query.where(where).del();
    } catch (error) {
      logger.error(
        `Error on "delete" method of ${
          this.tableName
        } with data: ${JSON.stringify(where)}, error: ${JSON.stringify(error)}`
      );
      throw new Error(`Error deleting ${this.tableName}`);
    }
  }

  /**
   * Inserts a record or updates it if a conflict occurs on the specified `where` constraint (like a primary or unique key).
   * Note: The `where` parameter is used here to specify the columns that determine a conflict (the `onConflict` columns in Knex).
   * @async
   * @param {(string|string[])} where - The column(s) used for conflict detection. Can be a single column name (string) or an array of column names (string[]).
   * @param {object} data - The data to be inserted/merged.
   * @param {object} [options={}] - Options for the query, including transaction.
   * @returns {Promise<number|any>} A promise that resolves to the result of the upsert operation (often the number of affected rows, but can vary depending on the database and Knex version).
   * @throws {Error} If the data is empty or there is a database error during upsert.
   */
  async upsert(where, data, options = {}) {
    try {
      const { query } = this._validateOptions(options);
      this._validateNotEmpty(data, "data");
      this._validateNotEmpty(where, "where");

      logger.info(
        `[${this.tableName}]: Upserting with data: ${JSON.stringify(data)}`
      );

      return await query.insert(data).onConflict(where).merge(data);
    } catch (error) {
      logger.error(
        `Error on "upsert" method of ${
          this.tableName
        } with data: ${JSON.stringify(data)}, error: ${JSON.stringify(error)}`
      );
      throw new Error(`Error upserting ${this.tableName}`);
    }
  }
}

/**
 * Executes a set of database operations within a Knex transaction.
 * @async
 * @param {function(object): Promise<any>} operations - An async function that accepts the Knex transaction object (`trx`) and performs database operations.
 * @returns {Promise<any>} A promise that resolves to the result of the `operations` function if the transaction commits successfully.
 * @throws {Error} Throws the error that caused the transaction to fail after rolling back.
 */
async function withTransaction(operations) {
  const trx = await db.transaction();

  try {
    const result = await operations(trx);
    await trx.commit();
    return result;
  } catch (error) {
    await trx.rollback();
    logger.error(`Transaction failed with error: ${error.message}`);
    throw error;
  }
}

module.exports = { BaseRepository, withTransaction };
