const dayjs = require("dayjs");
const { AxiosError } = require("axios");
require("dayjs/locale/es");

dayjs.locale("es");

const repoCompany = require("../repositories/company");
const repoBots = require("../repositories/bots");
const modelsXetux = require("../models/xetux");

const { getApi } = require("../utils/connectionNoco");
const requestXETUX = require("../utils/requestXetux");

const getTableColumns = async (data) => {
  try {
    const { tableID } = data;

    const nocodb = getApi(process.env.NOCODB_TOKEN);  

    const response = await nocodb.dbTable.read(tableID);

    const columnsFilters = ["Id", "CreatedAt", "UpdatedAt"];
    const filteredColumns = response.columns.filter((column) => {
      return (
        !columnsFilters.includes(column.title) &&
        !column.title.startsWith("nc_")
      );
    });

    const filteredData = filteredColumns.map((column) => {
      return {
        id: column.id,
        title: column.title,
        source_id: column.source_id,
        base_id: column.base_id,
        validate: column.validate,
        uid_data_type: column.uidt,
        data_type: column.dt,
      };
    });

    return filteredData;
  } catch (error) {
    let data = error?.response?.data;
    throw new Error(data.error ? data.error : data.msg);
  }
};

const insertTableData = async (query, body) => {
  try {
    const { projectID, tableID } = query;
    const tableData = body;

    const nocodb = getApi(process.env.NOCODB_TOKEN);  

    return await nocodb.dbTableRow.bulkCreate(
      "noco",
      projectID,
      tableID,
      tableData
    );
  } catch (error) {
    let data = error?.response?.data;
    throw new Error(data.error ? data.error : data.msg);
  }
};

const deleteTableData = async (data) => {
  try {
    const { projectID, tableID } = data;

    const nocodb = getApi(process.env.NOCODB_TOKEN);  

    return await nocodb.dbTableRow.bulkDeleteAll("noco", projectID, tableID);
  } catch (error) {
    throw new Error(error);
  }
};

const getTableData = async (data) => {
  try {
    const { projectID, tableID, limit, where } = data;

    const nocodb = getApi(process.env.NOCODB_TOKEN);  

    return await nocodb.dbTableRow.list("noco", projectID, tableID, {
      limit,
      where,
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        "Failed to fetch nocodb data. Please check source configs and try again."
      );
    }

    throw new Error(error);
  }
};

const getBaseTables = async (data) => {
  try {
    const { projectID } = data;

    const nocodb = getApi(process.env.NOCODB_TOKEN);  

    const response = await nocodb.dbTable.list(projectID);

    if (response.list.length == 0) {
      throw new Error("No base tables found.");
    }

    const filteredData = response.list.map((item) => {
      return {
        id: item.id,
        source_id: item.source_id,
        base_id: item.base_id,
        table_name: item.table_name,
        title: item.title,
        type: item.type,
        enabled: item.enabled,
        order: item.order,
      };
    });

    return filteredData;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        "Failed to fetch nocodb data. Please check source configs and try again."
      );
    }

    throw new Error(error);
  }
};

const getSalesSummary = async (query) => {
  try {
    const { bot_id: botID, from_date, to_date } = query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot ID ${botID} not found.`);
    }

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": botField.company_id,
    });
    if (!companyField) {
      throw new Error(`Company ID ${botField.company_id} not found.`);
    }

    const { uuid_unique: companyID } = companyField;

    const [projectField] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "XETUX_PROJECT_ID",
    });
    if (!projectField) {
      throw new Error(`Project ID ${botField.project_id} not found.`);
    }

    const [xetuxTableBalanceSummaryField] =
      await repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "XETUX_TABLE_BALANCE_SUMMARY",
      });
    if (
      !xetuxTableBalanceSummaryField ||
      xetuxTableBalanceSummaryField.data == ""
    ) {
      throw new Error(
        `Xetux Table Balance Summary configuration not found for company ${companyID}.`
      );
    }

    const [xetuxViewIDBalanceSummaryField] =
      await repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "XETUX_VIEW_ID_BALANCE_SUMMARY",
      });
    if (
      !xetuxViewIDBalanceSummaryField ||
      xetuxViewIDBalanceSummaryField.data == ""
    ) {
      throw new Error(
        `Xetux Table Balance Summary configuration not found for company ${companyID}.`
      );
    }

    const nocodb = getApi(process.env.NOCODB_TOKEN);  

    const from = dayjs(from_date).startOf("day").valueOf();
    const to = dayjs(to_date).endOf("day").valueOf();

    const where = `(datetime_long,btw,${from},${to})`;

    const data = await nocodb.dbTableRow.list(
      "noco",
      projectField.data,
      xetuxTableBalanceSummaryField.data,
      {
        limit: 100,
        offset: 0,
        where: where,
      }
    );

    if (!data || data.list.length == 0) {
      return false;
    }

    const totals = {
      sales_orders: 0.0,
      sales_amount: 0.0,
      sales_amount_net: 0.0,
      sales_tax: 0.0,
      purchases_orders: 0.0,
      purchases_amount: 0.0,
      purchases_amount_net: 0.0,
    };

    for (const row of data.list) {
      for (const key in totals) {
        totals[key] = totals[key] + parseFloat(row[key]);
      }
    }

    return totals;
  } catch (error) {
    throw new Error(error);
  }
};

const compareSalesSummary = async (query) => {
  try {
    const { bot_id: botID, sales_periods, chart_type } = query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });
    if (!botField) {
      throw new Error(`Bot ID ${botID} not found.`);
    }

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": botField.company_id,
    });
    if (!companyField) {
      throw new Error(`Company ID ${botField.company_id} not found.`);
    }

    const { uuid_unique: companyID } = companyField;

    const [projectField] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "XETUX_PROJECT_ID",
    });
    if (!projectField) {
      throw new Error(`Project ID ${botField.project_id} not found.`);
    }

    const [xetuxTableBalanceSummaryField] =
      await repoCompany.getCompanyConfigByField(
        {
          "company_configs.company_id": companyID,
          "company_configs.bot_id": botID,
        },
        "extension",
        "XETUX_TABLE_BALANCE_SUMMARY"
      );
    if (
      !xetuxTableBalanceSummaryField ||
      xetuxTableBalanceSummaryField.data == ""
    ) {
      throw new Error(
        `Xetux Table Balance Summary configuration not found for company ${companyID}.`
      );
    }

    const datas = {};
    const nocodb = getApi(process.env.NOCODB_TOKEN);  

    for (const period of sales_periods) {
      const from = dayjs(period.from).startOf("day").valueOf();
      const to = dayjs(period.to).endOf("day").valueOf();

      const where = `(datetime_long,btw,${from},${to})`;

      const periodData = await nocodb.dbTableRow.list(
        "noco",
        projectField.data,
        xetuxTableBalanceSummaryField.data,
        {
          limit: 200,
          offset: 0,
          where: where,
        }
      );

      const month = dayjs(period.from).format("MMMM");

      if (periodData.list.length > 0) {
        datas[month] = periodData.list;
      }
    }

    if (Object.keys(datas).length == 0) {
      return false;
    }

    return await modelsXetux.handleCronCompareSalesMonthly({
      periods: sales_periods,
      chart_type,
      datas,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const cronSaveXetuxSummaryData = async (query, data) => {
  try {
    const { company_id: companyID, bot_id: botID, projectID } = query;

    const [xetuxTableBalanceSummaryField] =
      await repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "XETUX_TABLE_BALANCE_SUMMARY",
      });
    if (
      !xetuxTableBalanceSummaryField ||
      xetuxTableBalanceSummaryField.data == ""
    ) {
      throw new Error(
        `Xetux Table Balance Summary configuration not found for company ${companyID}.`
      );
    }

    const nocodb = getApi(process.env.NOCODB_TOKEN);  

    await nocodb.dbTableRow.create(
      "noco",
      projectID,
      xetuxTableBalanceSummaryField.data,
      data
    );

    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const cronSaveXetuxSalesFullData = async (query) => {
  try {
    const { company_id: companyID, bot_id: botID, xetuxURL, projectID } = query;

    const [xetusTableSalesFullField] =
      await repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "XETUX_TABLE_SALES_FULL",
      });
    if (!xetusTableSalesFullField || xetusTableSalesFullField.data == "") {
      throw new Error(
        `Xetux Table PurchaseFull configuration not found for company ${companyID}.`
      );
    }

    const now = dayjs().format("YYYYMMDD");
    const params = {
      xetux_url: xetuxURL,
      endpoint: `xconnect/api/ExtractionData/SalesFull?dateFrom=${now}&dateEnd=${now}`,
      method: "GET",
    };

    const data = await requestXETUX(params);
    if (!data) {
      throw new Error(`Xetux data not found.`);
    }

    const nocodb = getApi(process.env.NOCODB_TOKEN);  

    await nocodb.dbTableRow.bulkCreate(
      "noco",
      projectID,
      xetusTableSalesFullField.data,
      data
    );

    return data;
  } catch (error) {
    throw new Error(error);
  }
};

const cronSaveXetuxSalesPayData = async (query) => {
  try {
    const { company_id: companyID, bot_id: botID, xetuxURL, projectID } = query;

    const [xetusTableSalesPayField] = await repoCompany.getCompanyConfigByField(
      {
        "company_configs.company_id": companyID,
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "XETUX_TABLE_SALES_PAY",
      }
    );
    if (!xetusTableSalesPayField || xetusTableSalesPayField.data == "") {
      throw new Error(
        `Xetux Table PurchaseFull configuration not found for company ${companyID}.`
      );
    }

    const now = dayjs().format("YYYYMMDD");
    const params = {
      xetux_url: xetuxURL,
      endpoint: `xconnect/api/ExtractionData/SalesPay?dateFrom=${now}&dateEnd=${now}`,
      method: "GET",
    };

    const data = await requestXETUX(params);
    if (!data) {
      throw new Error(`Xetux data not found.`);
    }

    const nocodb = getApi(process.env.NOCODB_TOKEN);  

    await nocodb.dbTableRow.bulkCreate(
      "noco",
      projectID,
      xetusTableSalesPayField.data,
      data
    );

    return data;
  } catch (error) {
    throw new Error(error);
  }
};

const cronSaveXetuxPurchaseFullData = async (query) => {
  try {
    const { company_id: companyID, bot_id: botID, xetuxURL, projectID } = query;

    const [xetusTablePurchaseFullField] =
      await repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "XETUX_TABLE_PURCHASE_FULL",
      });
    if (
      !xetusTablePurchaseFullField ||
      xetusTablePurchaseFullField.data == ""
    ) {
      throw new Error(
        `Xetux Table PurchaseFull configuration not found for company ${companyID}.`
      );
    }

    const now = dayjs().format("YYYYMMDD");
    const params = {
      xetux_url: xetuxURL,
      endpoint: `xconnect/api/ExtractionData/PurchaseFull?dateFrom=${now}&dateEnd=${now}`,
      method: "GET",
    };

    const data = await requestXETUX(params);
    if (!data) {
      throw new Error(`Xetux data not found.`);
    }

    const mappedData = data.map((item) => ({
      ...item,
      number_control: item.number_control ? item.number_control : 0,
      date_document_long: dayjs(item.date_document_string).valueOf(),
      date_reception_long: dayjs(item.date_reception_string).valueOf(),
    }));

    const nocodb = getApi(process.env.NOCODB_TOKEN);  

    await nocodb.dbTableRow.bulkCreate(
      "noco",
      projectID,
      xetusTablePurchaseFullField.data,
      mappedData
    );

    return mappedData;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getTableColumns,
  insertTableData,
  deleteTableData,
  getSalesSummary,
  getTableData,
  getBaseTables,
  compareSalesSummary,
  cronSaveXetuxSummaryData,
  cronSaveXetuxSalesFullData,
  cronSaveXetuxSalesPayData,
  cronSaveXetuxPurchaseFullData,
};
