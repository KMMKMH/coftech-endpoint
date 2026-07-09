const db = require("../utils/db");
const logger = require("../utils/logger");
const { up } = require("../utils/uuid_v4_trigger");

const saveBase = async (baseData) => {
  try {
    await db("desk_bases").insert(baseData);
    logger.info(`Saving desk base with data: ${JSON.stringify(baseData)}`);
  } catch (error) {
    logger.error(
      `Error saving desk base with data: ${JSON.stringify(
        baseData
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error saving desk base ${error}`);
  }
};

const updateBase = async (updateWhere, dataToUpdate) => {
  try {
    return await db("desk_bases").where(updateWhere).update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating where: ${JSON.stringify(
        updateWhere
      )} and data ${JSON.stringify(dataToUpdate)}, error: ${error.message}`
    );
  }
};

const getBaseByField = async (data, isRaw = false) => {
  try {
    const query = db("desk_bases");

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
      `Error getting base with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting raffle account data`);
  }
};

const deleteBase = async (data) => {
  try {
    logger.info(`delete base where: ${JSON.stringify(data)}`);
    return await db("desk_bases").where(data).del();
  } catch (e) {
    logger.error(
      `Error deleting base with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error deleting file`);
  }
};

const saveTableReference = async (data) => {
  try {
    logger.info(`Saving desk table with data: ${JSON.stringify(data)}`);
    const [tableIdField] = await db("desk_tables").insert(data);

    if (!tableIdField) {
      throw new Error(`Error saving desk table`);
    }

    return tableIdField
      ? (await getTableByField({ "desk_tables.id": tableIdField }))[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving desk table with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(error);
  }
};

const saveColumnsReference = async (data) => {
  const { columns, table_id } = data;

  try {
    logger.info(`Saving desk table with data: ${JSON.stringify(data)}`);

    if (!columns || columns.length === 0) {
      throw new Error("No columns to insert");
    }

    if (Array.isArray(columns)) {
      for (const column of columns) {
        const { name, type } = column;

        await db("desk_columns").insert({
          table_id,
          column_name: name,
          column_type: type,
        });
      }
    } else {
      await db("desk_columns").insert({
        table_id,
        column_name: columns.name,
        column_type: columns.type,
      });
    }

    const columnsField = await getColumnsByField({
      "desk_columns.table_id": table_id,
    });

    return columnsField;
  } catch (error) {
    logger.error(
      `Error saving desk table with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(error);
  }
};

const updateTable = async (updateWhere, dataToUpdate) => {
  try {
    return await db("desk_tables").where(updateWhere).update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating where: ${JSON.stringify(
        updateWhere
      )} and data ${JSON.stringify(dataToUpdate)}, error: ${error.message}`
    );
  }
};

const deleteTable = async (data) => {
  const { uuid_unique, customer_table_name, base_id } = data;

  try {
    logger.info(`delete table where: ${JSON.stringify(data)}`);

    await db.schema.dropTableIfExists(customer_table_name);

    await db("desk_tables")
      .where({
        "desk_tables.uuid_unique": uuid_unique,
        "desk_tables.base_id": base_id,
      })
      .del();
  } catch (e) {
    logger.error(
      `Error deleting table with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error deleting table: ${JSON.stringify(e)} `);
  }
};

const generateTableName = () => {
  const prefix = "desk_customer_";
  const timestamp = Date.now();
  return `${prefix}${timestamp}`;
};

async function createTable(table_name, baseID, columns) {
  const generatedTableName = generateTableName();

  try {
    await db.schema.createTable(generatedTableName, function (table) {
      table.specificType("id", "int NOT NULL AUTO_INCREMENT").primary();
      table.string("uuid_unique").unique().notNullable();
      table.timestamps(true, true);
      columns.forEach((col) => {
        table.text(col.name, "longtext");
      });
    });

    await db.raw(up(generatedTableName));

    const tableReference = {
      table_name,
      base_id: baseID,
      customer_table_name: generatedTableName,
    };

    const table = await saveTableReference(tableReference);

    const columnsReference = {
      table_id: table.uuid_unique,
      columns,
    };

    const columnsRef = await saveColumnsReference(columnsReference);

    logger.info(`table created successfully `);
    return { table, columnsRef };
  } catch (error) {
    throw new Error(`error creating table ${error} .`);
  }
}

const getTableByField = async (data, isRaw = false) => {
  try {
    const query = db("desk_tables").select(
      "uuid_unique",
      "customer_table_name",
      "table_name",
      "created_at",
      "updated_at"
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
      `Error getting table with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting table`);
  }
};

const getColumnsByField = async (data, isRaw = false) => {
  try {
    const query = db("desk_columns").select(
      "uuid_unique",
      "column_name",
      "column_type"
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
      `Error getting columns with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting columns`);
  }
};

const getDataTableByField = async (
  tableName,
  data = "",
  limit,
  isRaw = false
) => {
  try {
    const query = db(tableName);

    if (data.length > 0) {
      if (isRaw) {
        query.whereRaw(data);
      } else {
        query.where(data);
      }
    }

    if (limit && limit > 0) {
      query.limit(limit);
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
      `Error getting table with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting table`);
  }
};

const saveData = async (tableName, data) => {
  try {
    logger.info(`Saving data in table ${tableName} - ${JSON.stringify(data)}`);
    return await db(tableName).insert(data);
  } catch (error) {
    logger.error(
      `Error saving data in table ${tableName} with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error saving data in table`);
  }
};

const updateData = async (tableName, updateWhere, dataToUpdate) => {
  try {
    logger.info(
      `Updating data in table ${tableName} - ${JSON.stringify(dataToUpdate)}`
    );

    return db(tableName).where(updateWhere).update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error Updating data in table ${tableName} data: ${JSON.stringify(
        dataToUpdate
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error Updating data in table`);
  }
};

const deleteData = async (tableName, deleteWhere) => {
  try {
    logger.info(
      `deleting data in table ${tableName} - ${JSON.stringify(deleteWhere)}`
    );

    return db(tableName).where(deleteWhere).del();
  } catch (error) {
    logger.error(
      `Error deleting data in table ${tableName} data: ${JSON.stringify(
        deleteWhere
      )}, error: ${error}`
    );
    throw new Error(`Error deleting data in table`);
  }
};

const createColumn = async (tableName, column) => {
  const ColumnTypes = {
    STRING: "string",
    INT: "int",
    FLOAT: "float",
    LONGTEXT: "longtext",
  };

  try {
    await db.schema.alterTable(tableName, function (table) {
      /* eslint-disable */
      switch (column.type) {
        case ColumnTypes.STRING:
          table.string(column.name);
          break;
        case ColumnTypes.INT:
          table.integer(column.name);
          break;
        case ColumnTypes.FLOAT:
          table.float(column.name);
          break;
        case ColumnTypes.LONGTEXT:
          table.text(column.name, "longtext");
          break;
        default:
          throw new Error(
            `Error creating column: ${column.type} not supported.`
          );
      }
      /* eslint-enable */
    });

    const [tableField] = await getTableByField({
      "desk_tables.customer_table_name": tableName,
    });

    const columnsReference = {
      table_id: tableField.uuid_unique,
      columns: column,
    };

    const columnsRef = await saveColumnsReference(columnsReference);

    logger.info(`column created successfully `);
    return { table: tableField, columns: columnsRef };
  } catch (error) {
    throw new Error(`error creating column ${error} .`);
  }
};

const deleteColumn = async (tableName, columnName) => {
  try {
    await db.schema.alterTable(tableName, function (table) {
      table.dropColumn(columnName);
    });

    const [tableField] = await getTableByField({
      "desk_tables.customer_table_name": tableName,
    });

    const result = await db("desk_columns")
      .where({ table_id: tableField.uuid_unique, column_name: columnName })
      .del();

    if (result) {
      logger.info(`Column ${columnName} deleted successfully`);
    } else {
      logger.warn(`Column ${columnName} not found in references`);
    }

    return { success: true, column: columnName };
  } catch (error) {
    throw new Error(`Error deleting column: ${error.message}`);
  }
};

const updateColumn = async (updateWhere, dataToUpdate) => {
  try {
    const { column_name: new_column_name } = dataToUpdate;
    const { customer_table_name, columnID } = updateWhere;

    if (new_column_name) {
      const [columnField] = await getColumnsByField({
        "desk_columns.uuid_unique": columnID,
      });

      if (!columnField) {
        throw new Error(`Column with ID ${columnID} not found.`);
      }

      const { column_name } = columnField;

      await db.schema.alterTable(customer_table_name, function (table) {
        table.renameColumn(column_name, new_column_name);
      });
    }

    const result = await db("desk_columns")
      .where({
        "desk_columns.uuid_unique": columnID,
      })
      .update(dataToUpdate);

    return result;
  } catch (error) {
    throw new Error(`Error updating column: ${error.message}`);
  }
};

module.exports = {
  saveBase,
  updateBase,
  getBaseByField,
  deleteBase,
  deleteTable,
  createTable,
  updateTable,
  getTableByField,
  getColumnsByField,
  getDataTableByField,
  saveData,
  updateData,
  deleteData,
  createColumn,
  deleteColumn,
  updateColumn,
};
