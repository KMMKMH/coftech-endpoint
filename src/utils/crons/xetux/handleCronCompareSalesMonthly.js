const dayjs = require("dayjs");
const { JSDOM } = require("jsdom");
const svg2img = require("svg2img");
const path = require("path");

const modelXetux = require("../../../models/xetux");

const handleCronCompareSalesMonthly = async (data) => {
  const { bot_id, company_id, created_at } = data;

  const firstDayOfLastMonth = dayjs()
    .subtract(1, "month")
    .startOf("month")
    .format("YYYYMMDD");
  const lastDayOfLastMonth = dayjs()
    .subtract(1, "month")
    .endOf("month")
    .format("YYYYMMDD");

  const createdAtDate = dayjs(created_at);
  const firstDayOfCurrentMonth = createdAtDate
    .startOf("month")
    .format("YYYYMMDD");
  const lastDayOfCurrentMonth = createdAtDate.endOf("month").format("YYYYMMDD");

  const lastMonthData = await modelXetux.getSales({
    companyID: company_id,
    botID: bot_id,
    dateFrom: firstDayOfLastMonth,
    dateEnd: lastDayOfLastMonth,
  });

  const currentMonthData = await modelXetux.getSales({
    companyID: company_id,
    botID: bot_id,
    dateFrom: firstDayOfCurrentMonth,
    dateEnd: lastDayOfCurrentMonth,
  });

  const data1 = {
    from: lastMonthData.from,
    to: lastMonthData.to,
    totals: lastMonthData.totals,
    paymentMethodCounts: lastMonthData.paymentMethodCounts,
    totalOrdersPerDay: lastMonthData.totalOrdersPerDay,
  };

  const data2 = {
    from: currentMonthData.from,
    to: currentMonthData.to,
    totals: currentMonthData.totals,
    paymentMethodCounts: currentMonthData.paymentMethodCounts,
    totalOrdersPerDay: currentMonthData.totalOrdersPerDay,
  };

  const d3 = await import("d3");

  const width = 1000;
  const height = 600;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };

  const dataGraph1 = Object.keys(data1.totalOrdersPerDay).map((date) => {
    return {
      date: date.slice(-2),
      value: data1.totalOrdersPerDay[date],
    };
  });

  const dataGraph2 = Object.keys(data2.totalOrdersPerDay).map((date) => {
    return {
      date: date.slice(-2),
      value: data2.totalOrdersPerDay[date],
    };
  });

  const allDates = [
    ...new Set([
      ...dataGraph1.map((d) => d.date),
      ...dataGraph2.map((d) => d.date),
    ]),
  ];

  const totalOrders1 = dataGraph1.reduce((sum, d) => sum + d.value, 0);
  const totalOrders2 = dataGraph2.reduce((sum, d) => sum + d.value, 0);

  const line1Color = totalOrders1 < totalOrders2 ? "#EF4444" : "#22C55E";
  const line2Color = totalOrders2 < totalOrders1 ? "#EF4444" : "#22C55E";

  const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
  const body = d3.select(dom.window.document.querySelector("body"));

  const svg = body
    .append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3
    .scalePoint()
    .domain(allDates)
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max([...dataGraph1, ...dataGraph2], (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line1 = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.value));

  const line2 = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.value));

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .style("fill", "#0F172A")
    .text("Monthly sales report");

  svg
    .append("image")
    .attr("xlink:href", path.join(__dirname, "../", "img", "coftech-logo.png"))  
    .attr("x", width - margin.right - 100)
    .attr("y", height - margin.bottom - 25)
    .attr("width", 120)
    .attr("height", 120);

  svg
    .append("rect")
    .attr("x", width - margin.right - 150)
    .attr("y", margin.top - 30)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", line1Color);

  svg
    .append("text")
    .attr("x", width - margin.right - 135)
    .attr("y", margin.top - 20)
    .attr("text-anchor", "start")
    .style("font-size", "14px")
    .style("fill", "#0F172A")
    .text(
      `${dayjs(data1.from, "YYYYMMDD").format("DD/MM/YYYY")} a ${dayjs(
        data1.to,
        "YYYYMMDD"
      ).format("DD/MM/YYYY")}`
    );

  svg
    .append("rect")
    .attr("x", width - margin.right - 150)
    .attr("y", margin.top - 10)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", line2Color);

  svg
    .append("text")
    .attr("x", width - margin.right - 135)
    .attr("y", margin.top)
    .attr("text-anchor", "start")
    .style("font-size", "14px")
    .style("fill", "#0F172A")
    .text(
      `${dayjs(data2.from, "YYYYMMDD").format("DD/MM/YYYY")} a ${dayjs(
        data2.to,
        "YYYYMMDD"
      ).format("DD/MM/YYYY")}`
    );

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg
    .append("path")
    .datum(dataGraph1)
    .attr("fill", "none")
    .attr("stroke", line1Color)
    .attr("stroke-width", 3)
    .attr("d", line1);

  svg
    .append("path")
    .datum(dataGraph2)
    .attr("fill", "none")
    .attr("stroke", line2Color)
    .attr("stroke-width", 3)
    .attr("d", line2);

  svg
    .selectAll("text.label1")
    .data(dataGraph1)
    .enter()
    .append("text")
    .attr("class", "label1")
    .attr("x", (d) => x(d.date))
    .attr("y", (d) => y(d.value))
    .attr("dy", "-0.5em")
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#0F172A")
    .text((d) => d.value);

  svg
    .selectAll("text.label2")
    .data(dataGraph2)
    .enter()
    .append("text")
    .attr("class", "label2")
    .attr("x", (d) => x(d.date))
    .attr("y", (d) => y(d.value))
    .attr("dy", "-0.5em")
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#0F172A")
    .text((d) => d.value);

  const svgString = body.html();

  if (!svgString.includes("<svg") || !svgString.includes("</svg>")) {
    return;
  }

  svg2img(
    svgString,
    { width: width * 2, height: height * 2 },
    (error, buffer) => {
      if (error) {
        console.error("Error converting SVG to PNG:", error);
        return;
      }

      const base64Image = buffer.toString("base64");
      console.log("Imagen en Base64:\n", base64Image);
    }
  );
};

module.exports = handleCronCompareSalesMonthly;
