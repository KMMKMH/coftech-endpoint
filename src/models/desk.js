const repoDesk = require("../repositories/desk");

const saveBase = async (baseInfo, companyData) => {
  const { name } = baseInfo;
  const { companyID } = companyData;

  const baseData = {
    company_id: companyID,
    name,
  };

  try {
    return await repoDesk.saveBase(baseData);
  } catch (error) {
    throw new Error(error);
  }
};

const updateBase = async (query, data) => {
  try {
    const { baseID, companyID } = query;

    const [baseField] = await repoDesk.getBaseByField({
      "desk_bases.uuid_unique": baseID,
      "desk_bases.company_id": companyID,
    });

    if (!baseField) {
      throw new Error(`Base with data ${JSON.stringify(query)} not found`);
    }

    const fieldsToUpdate = ["name"];

    const dataToUpdate = await getDataToUpdate(baseField, data, fieldsToUpdate);

    const where = {
      "desk_bases.uuid_unique": baseID,
      "desk_bases.company_id": companyID,
    };

    if (Object.keys(dataToUpdate).length > 0) {
      return await repoDesk.updateBase(where, dataToUpdate);
    } else {
      return false;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteBase = async (whereData) => {
  try {
    const { baseID, companyID } = whereData;

    const [baseField] = await repoDesk.getBaseByField({
      "desk_bases.uuid_unique": baseID,
      "desk_bases.company_id": companyID,
    });

    if (!baseField) {
      throw new Error(`Base not exist`);
    }

    const response = await repoDesk.deleteBase({
      "desk_bases.uuid_unique": baseID,
      "desk_bases.company_id": companyID,
    });

    return response;
  } catch (error) {
    throw new Error(error);
  }
};

const createTable = async (body, query) => {
  const { table_name, columns } = body;
  const { baseID } = query;

  const table = await repoDesk.createTable(table_name, baseID, columns);

  return table;
};

const deleteTable = async (query) => {
  try {
    const { tableID, baseID } = query;

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
      "desk_tables.base_id": baseID,
    });

    if (!tableField) {
      throw new Error(`Table with data ${JSON.stringify(query)} not found`);
    }

    const { customer_table_name } = tableField;

    const whereDelete = {
      uuid_unique: tableID,
      base_id: baseID,
      customer_table_name,
    };

    const response = await repoDesk.deleteTable(whereDelete);

    return response;
  } catch (error) {
    throw new Error(error);
  }
};

const updateTable = async (query, data) => {
  try {
    const { tableID } = query;

    const [tableField] = await repoDesk.getTableByField({
      uuid_unique: tableID,
    });

    if (!tableField) {
      throw new Error(`Base with data ${JSON.stringify(query)} not found`);
    }

    const fieldsToUpdate = ["table_name"];

    const dataToUpdate = await getDataToUpdate(
      tableField,
      data,
      fieldsToUpdate
    );

    const where = {
      "desk_tables.uuid_unique": tableID,
    };

    if (Object.keys(dataToUpdate).length > 0) {
      return await repoDesk.updateTable(where, dataToUpdate);
    } else {
      return false;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const getDataToUpdate = async (modelField, data, fieldsToUpdate) => {
  let dataToUpdate = {};

  fieldsToUpdate.forEach((field) => {
    if (data[field] != undefined && data[field] != modelField[field]) {
      dataToUpdate[field] = data[field];
    }
  });

  return dataToUpdate;
};

const validateDataByColumnType = async (columnType, data) => {
  const MAX_VARCHAR_LENGTH = 255;

  switch (columnType) {
  case "int": {
    const parsedValue = parseInt(data, 10);
    if (isNaN(parsedValue)) {
      throw new Error(`The value '${data}' is not a valid integer.`);
    }
    return true;
  }

  case "float": {
    const parsedValue = parseFloat(data);
    if (isNaN(parsedValue) || !isFinite(parsedValue)) {
      throw new Error(`The value '${data}' is not a valid float.`);
    }
    return true;
  }

  case "string": {
    if (typeof data !== "string") {
      if (data == null) {
        throw new Error(`The value '${data}' is null or undefined.`);
      }
      data = String(data); 
    }

    if (data.length > MAX_VARCHAR_LENGTH) {
      throw new Error(
        `The string is too long. Max length for string is ${MAX_VARCHAR_LENGTH} characters. Received string length: ${data.length}.`
      );
    }

    return true;
  }

  case "longtext": {
    if (typeof data !== "string") {
      if (data == null) {
        throw new Error(`The value '${data}' is null or undefined.`);
      }
      data = String(data);
    }

    return true;
  }

  default:
    throw new Error(`Unknown column type: '${columnType}'.`);
  }
};

const insertData = async (body) => {
  const { tableID, columnData } = body;

  try {
    const columns = await Promise.all(
      columnData.map(async (dataItem) => {
        const { columnID, data } = dataItem;

        const [columnField] = await repoDesk.getColumnsByField({
          "desk_columns.uuid_unique": columnID,
          "desk_columns.table_id": tableID,
        });

        if (!columnField) {
          throw new Error(`Column with ID ${columnID} not found.`);
        }

        const { column_name, column_type } = columnField;

        await validateDataByColumnType(column_type, data);
        return { column_name, data };
      })
    );

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    const { customer_table_name } = tableField;

    const insertDataObject = columns.reduce((acc, { column_name, data }) => {
      acc[column_name] = data;
      return acc;
    }, {});

    return await repoDesk.saveData(customer_table_name, insertDataObject);
  } catch (error) {
    throw new Error(
      `Error saving data in table with id ${tableID} - ${error.message}`
    );
  }
};

const getDataTable = async (query) => {
  const { tableID, limit, where, isRaw } = query;

  try {
    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    const { customer_table_name } = tableField;

    return await repoDesk.getDataTableByField(
      customer_table_name,
      where,
      limit,
      isRaw
    );
  } catch (error) {
    throw new Error(
      `error getting data from table with id ${tableID} error: ${error.message}`
    );
  }
};

const updateData = async (tableID, columnID, body) => {
  const { rowID, data } = body;

  try {
    const [columnField] = await repoDesk.getColumnsByField({
      "desk_columns.uuid_unique": columnID,
      "desk_columns.table_id": tableID,
    });

    const { column_name, column_type } = columnField;

    await validateDataByColumnType(column_type, data);

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    const { customer_table_name } = tableField;

    const updateWhere = {
      [`${customer_table_name}.uuid_unique`]: rowID,
    };

    const dataToUpdate = {
      [column_name]: data,
    };

    return await repoDesk.updateData(
      customer_table_name,
      updateWhere,
      dataToUpdate
    );
  } catch (error) {
    throw new Error(
      `error updating data in table with id ${tableID} - ${error} `
    );
  }
};

const deleteData = async (tableName, rowID) => {
  try {
    const deleteWhere = {
      [`${tableName}.uuid_unique`]: rowID,
    };

    return await repoDesk.deleteData(tableName, deleteWhere);
  } catch (error) {
    throw new Error(`error updating data in table ${tableName} - ${error}`);
  }
};

const createColumn = async (body, query) => {
  const { tableID } = query;

  try {
    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    const { customer_table_name } = tableField;

    return await repoDesk.createColumn(customer_table_name, body);
  } catch (error) {
    throw new Error(`error creating column in table ${tableID} - ${error}`);
  }
};

const deleteColumn = async (query) => {
  const { tableID, columnID } = query;

  try {
    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    const [columnField] = await repoDesk.getColumnsByField({
      "desk_columns.uuid_unique": columnID,
    });

    const { customer_table_name } = tableField;
    const { column_name } = columnField;

    return await repoDesk.deleteColumn(customer_table_name, column_name);
  } catch (error) {
    throw new Error(`error deleting column in table ${tableID} - ${error}`);
  }
};

const updateColumn = async (body, query) => {
  try {
    const { tableID, columnID } = query;

    const [tableField] = await repoDesk.getTableByField({
      "desk_tables.uuid_unique": tableID,
    });

    if (!tableField) {
      throw new Error(`Table with ID ${tableID} not found.`);
    }

    const [columnField] = await repoDesk.getColumnsByField({
      "desk_columns.uuid_unique": columnID,
    });

    if (!columnField) {
      throw new Error(`Column with ID ${columnID} not found.`);
    }

    const { customer_table_name } = tableField;

    const updateWhere = {
      columnID,
      customer_table_name,
    };

    const immutableFields = ["uuid_unique", "created_at", "updated_at"];

    const dataToUpdate = Object.fromEntries(
      Object.entries(body).filter(([key]) => !immutableFields.includes(key))
    );

    if (Object.keys(dataToUpdate).length === 0) {
      throw new Error("No valid fields to update.");
    }

    return await repoDesk.updateColumn(updateWhere, dataToUpdate);
  } catch (error) {
    throw new Error(
      `Error updating column in tablSe ${query?.tableID || "unknownS"} - ${
        error.message
      }`
    );
  }
};

module.exports = {
  saveBase,
  updateBase,
  deleteBase,
  createTable,
  getDataTable,
  updateTable,
  deleteTable,
  insertData,
  updateData,
  deleteData,
  createColumn,
  deleteColumn,
  updateColumn,
};
