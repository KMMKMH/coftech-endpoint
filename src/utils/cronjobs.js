const { CronJob } = require("cron");
const campaignCron = require("./crons/campaigns/cron");
const cronKeyTask = require("./cronKeyTask");
const monitorTimeoutPayments = require("./crons/payments/monitorTimeoutPayments");
const monitorQueuePayments = require("./monitorQueuePayments");
const blacklistCron = require("./crons/utils/blacklistCron");
const ragUploadCron = require("./crons/utils/ragUploadCron");

const initializeCronjobs = () => {
  const cronJobs = [
    { schedule: "*/30 * * * * *", task: cronKeyTask },
    { schedule: "*/2 * * * * *", task: monitorTimeoutPayments },
    { schedule: "* * * * *", task: monitorQueuePayments },
    { schedule: "*/30 * * * * *", task: campaignCron },
    { schedule: "0 0 * * *", task: blacklistCron },
    { schedule: "*/3 * * * *", task: ragUploadCron },
  ];

  for (const { schedule, task } of cronJobs) {
    new CronJob(schedule, task, null, true, "America/Bogota");
  }
};

module.exports = initializeCronjobs;
