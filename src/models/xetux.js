require("dotenv").config();
const dayjs = require("dayjs");
const path = require("path");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const chartjsPluginDatalabels = require("chartjs-plugin-datalabels");
const { createCanvas, loadImage } = require("canvas");

const repoCompany = require("../repositories/company");

const { getApi } = require("../utils/connectionNoco");

const getSales = async (data) => {
  try {
    const { companyID, botID, dateFrom, dateEnd } = data;

    const [xetuxConfigStatus] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "XETUX_STATUS",
    });
    const [xetuxConfigStatusSales] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "XETUX_STATUS_SALES_DAILY",
    });
    const [xetuxConfigURL] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "XETUX_URL",
    });

    if (!xetuxConfigStatus || xetuxConfigStatus.data !== "true") return false;
    if (!xetuxConfigStatusSales || xetuxConfigStatusSales.data !== "true")
      return false;
    if (!xetuxConfigURL || xetuxConfigStatusSales.data.trim() === "")
      return false;

    let dateRange = `(datetime_string,eq,today)`;
    if (dateFrom && dateEnd && dateFrom != dateEnd) {
      dateRange = `(bill_datetime_long,btw,${new Date(
        dateFrom
      ).getTime()},${new Date(dateEnd).getTime()})`;
    }

    const NocoDBToken = process.env.NOCODB_TOKEN;  

    const paymentsData = await getApi(NocoDBToken).dbViewRow.list(
      "noco",
      "ppyao0nhbixv3i5",
      "mxk7wnfvj23uxa8",
      "vw64eqyqjdchvhf6",
      {
        limit: 250,
        where: dateRange,
      }
    );

    const salesData = await getApi(NocoDBToken).dbViewRow.list(
      "noco",
      "ppyao0nhbixv3i5",
      "mxys8if9fgent19",
      "vwo7wtp4grmr3eik",
      {
        limit: 250,
        where: dateRange,
      }
    );

    return {
      from: dateFrom,
      to: dateEnd,
      ...(await transformSales(salesData.list, paymentsData.list)),
    };
  } catch (error) {
    throw new Error(error);
  }
};

const getPurchases = async (data) => {
  try {
    const { companyID, botID, date } = data;

    const [xetuxConfigStatus] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "XETUX_STATUS",
    });
    if (!xetuxConfigStatus || xetuxConfigStatus.data !== "true") {
      return false;
    }

    let dateRange = date
      ? `(date_document_string,eq,exactDate,${dayjs(date).format("YYYY-MM-DD")})`
      : `(date_document_string,eq,today)`;

    const NocoDBToken = process.env.NOCODB_TOKEN;  
    const purchaseData = await getApi(NocoDBToken).dbViewRow.list(
      "noco",
      "ppyao0nhbixv3i5",
      "mnsdv00ivs39b7z",
      "vwng8hgp10oarim3",
      {
        limit: 250,
        where: dateRange,
      }
    );

    const parseAmount = (value) => parseFloat(value);

    let totalAmountPeriod = 0,
      totalTax = 0,
      totalDiscount = 0,
      totalNet = 0,
      totalProducts = 0;

    purchaseData.list.forEach((item) => {
      totalAmountPeriod += parseAmount(item.total_bill);
      totalTax += parseAmount(item.tax_bill);
      totalDiscount += parseAmount(item.discount_bill);
      totalNet += parseAmount(item.net_bill);
      totalProducts++;
    });

    return {
      totalAmountPeriod,
      totalTax,
      totalDiscount,
      totalNet,
      totalProducts,
      purchaseData,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const transformSales = (data, payments) => {
  const orderIds = new Set();
  const uniqueOrders = [];
  let totalAmountPeriod = 0,
    totalTips = 0,
    totalNet = 0,
    totalTax = 0,
    totalOrders = 0,
    totalOrdersPerDay = {};
  const paymentMethodCounts = {};

  const parseAmount = (value) => parseFloat(value);

  data.forEach((item) => {
    if (!orderIds.has(item.order_id)) {
      const payment = payments.find(
        (payment) => payment.order_id == item.order_id
      );

      const filteredItem = {
        journal_id: item.journal_id,
        order_id: item.order_id,
        bill_id: item.bill_id,
        bill_number: item.bill_number,
        bill_datetime_long: item.bill_datetime_long,
        bill_datetime_string: item.bill_datetime_string,
        amount_igtf: item.amount_igtf,
        type_doc: item.type_doc,
        fact_notec: item.fact_notec,
        status: item.status,
        sale_voucher: item.sale_voucher,
        customer_id: item.customer_id,
        suborder_id: item.suborder_id,
        subtotal: item.subtotal,
        discount: item.discount,
        net_price: item.net_price,
        tax_value: item.tax_value,
        service_value: item.service_value,
        tips: item.tips,
        total: item.total,
        tax_percentage: item.tax_percentage,
        exchange_date_day: item.exchange_date_day,
        fiscal_printer_serial: item.fiscal_printer_serial,
        station_bill_id: item.station_bill_id,
        station_name: item.station_name,
        customer_name: item.customer_name,
        customer_identification: item.customer_identification,
        journal_start: item.journal_start,
        journal_end: item.journal_end,
        customer_type: item.customer_type,
        customer_address: item.customer_address,
        customer_phone: item.customer_phone,
        tax_id: item.tax_id,
        payment_details: payment
          ? {
            payform_id: payment.payform_id,
            payform_description: payment.payform_description,
            currency_id: payment.currency_id,
            currency_description: payment.currency_description,
            payment_datetime: payment.payment_datetime,
            amount_base_currency: payment.amount_base_currency,
            amount_tips_alternative_currency:
              payment.amount_tips_alternative_currency,
            amount_alternative_currency: payment.amount_alternative_currency,
            amount_tips_base_currency: payment.amount_tips_base_currency,
            amount_change_base_currency: payment.amount_change_base_currency,
            amount_change_alternative_currency:
              payment.amount_change_alternative_currency,
            payments_tips_base_currency: payment.payments_tips_base_currency,
            payments_tips_alternative_currency:
              payment.payments_tips_alternative_currency,
          }
          : null,
      };

      uniqueOrders.push(filteredItem);
      orderIds.add(item.order_id);

      if (item.type_doc == "FACT") {
        totalAmountPeriod += parseAmount(item.total);
        totalTips += parseAmount(item.tips);
        totalNet += parseAmount(item.net_price);
        totalTax += parseAmount(item.tax_value);
        totalOrders += 1;
      }

      const itemDate = dayjs(item.bill_datetime_long).format("YYYY-MM-DD");

      totalOrdersPerDay[itemDate] = (totalOrdersPerDay[itemDate] || 0) + 1;

      if (payment) {
        if (paymentMethodCounts[payment.payform_description]) {
          paymentMethodCounts[payment.payform_description]++;
        } else {
          paymentMethodCounts[payment.payform_description] = 1;
        }
      }
    }
  });

  return {
    totals: {
      amount: totalAmountPeriod,
      tips: totalTips,
      net: totalNet,
      tax: totalTax,
      orders: totalOrders,
    },
    paymentMethodCounts,
    totalOrdersPerDay,
    uniqueOrders,
    data,
  };
};

const transformPurchases = (data) => {
  const supplierIds = new Set();
  const uniquePurchases = [];
  let totalAmountPeriod = 0,
    totalNet = 0,
    totalTax = 0,
    totalPurchases = 0;
  const totalPurchasesPerSupplier = {};

  data.forEach((item) => {
    if (!supplierIds.has(item.supplier_id)) {
      const filteredItem = {
        header_id: item.header_id,
        supplier_id: item.supplier_id,
        supplier_name: item.supplier_name,
        supplier_rif: item.supplier_rif,
        date_document_string: item.date_document_string,
        total_bill: item.total_bill,
        currency_name: item.currency_name,
        items: [
          {
            item_id: item.item_id,
            product_name: item.product_name,
            product_quantity: item.product_quantity,
            product_cost_unit: item.product_cost_unit,
            product_cost_total: item.product_cost_total,
          },
        ],
      };

      uniquePurchases.push(filteredItem);
      supplierIds.add(item.supplier_id);
      totalAmountPeriod += item.total_bill;
      totalNet += item.net_bill;
      totalTax += item.tax_bill;
      totalPurchases += 1;

      totalPurchasesPerSupplier[item.supplier_name] =
        (totalPurchasesPerSupplier[item.supplier_name] || 0) + 1;
    }
  });

  return {
    totals: {
      amount: totalAmountPeriod,
      net: totalNet,
      tax: totalTax,
      purchases: totalPurchases,
    },
    totalPurchasesPerSupplier,
    uniquePurchases,
    data,
  };
};

const charts_configs = {
  line: {
    name: "line",
    fill: 0,
    datalabels: {
      align: "right",
    },
  },
  bar: {
    name: "bar",
    fill: null,
    datalabels: {
      anchor: "end",
      align: "end",
    },
  },
};

const handleCronCompareSalesMonthly = async (data) => {
  let chart_config = charts_configs[data.chart_type];
  if (!chart_config || !data.chart_type) {
    chart_config = charts_configs["line"];
  }

  const width = 1140;
  const height = 660;
  const margin = { top: 30, right: 40, bottom: 30, left: 40 };
  const dataGraphs = {};

  for (const [month, days] of Object.entries(data.datas)) {
    dataGraphs[month] = Array(31).fill(chart_config.fill);

    for (const day of days) {
      const dayIndex = day.datetime_string.split("-")[2] - 1;
      dataGraphs[month][dayIndex] = day.sales_orders || chart_config.fill;
    }
  }

  const allDates = Array.from({ length: 31 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  const backgroundColour = "#F8FBFF";
  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour,
  });

  const datasets = [];
  const colors = [
    "#1B89E6",
    "#2DD4FF",
    "#F5B841",
    "#0B5FA8",
    "#3BA3F7",
    "#22C55E",
    "#64748B",
  ];

  let i = 0;
  for (const [key, value] of Object.entries(dataGraphs)) {
    datasets.push({
      label: key,
      data: value,
      backgroundColor: [colors[i]],
      borderColor: [colors[i]],
      borderWidth: 1,
      xAxisID: "xAxis1",
    });

    i++;
  }

  const configuration = {
    type: chart_config.name,
    data: {
      labels: allDates,
      datasets: datasets,
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Monthly sales report",
          font: {
            size: 24,
            weight: "bold",
          },
          padding: {
            top: 10,
            bottom: 30,
          },
        },
        datalabels: {
          ...chart_config.datalabels,
          color: "#64748B",
          font: {
            weight: "bold",
            size: 12,
          },
          display: (context) => {
            const value = context.dataset.data[context.dataIndex];
            return value != 0;
          },
          formatter: (value) => {
            return value != 0 ? value : "";
          },
        },
      },
      layout: {
        padding: {
          left: margin.left,
          right: margin.right,
          top: margin.top,
          bottom: margin.bottom,
        },
      },
      scales: {
        y: {
          suggestedMin: 0,
        },
      },
    },
    plugins: [chartjsPluginDatalabels],
  };

  const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
  const base64Image = dataUrl.replace(/^data:image\/png;base64,/, "");

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const chartImage = await loadImage(`data:image/png;base64,${base64Image}`);
  ctx.drawImage(chartImage, 0, 0);

  const logoPath = path.resolve(__dirname, "../utils/img/coftech-logo.png");  
  const logo = await loadImage(logoPath);
  const logoWidth = 180;
  const logoHeight = 50;
  ctx.drawImage(logo, width - logoWidth - 40, 40, logoWidth, logoHeight);

  const finalBuffer = canvas.toBuffer("image/png");
  const finalBase64Image = finalBuffer.toString("base64");

  return finalBase64Image;
};

module.exports = {
  getSales,
  getPurchases,
  transformSales,
  transformPurchases,
  handleCronCompareSalesMonthly,
};
