const { handleCronDailySummary } = require("./handleCronDailySummary");

const executeXetuxCron = async (data) => {
  /* eslint-disable */
  switch (data.key) {
    case "XETUX_SUMMARY":
      await handleCronDailySummary({
        bot_id: data.bot_id,
        company_id: data.company_id
      });
      break;
    default:
      console.log(`Xetux cron key ${data.key} not found`);
      break;
  }
  /* eslint-enable */
};

module.exports = { executeXetuxCron };