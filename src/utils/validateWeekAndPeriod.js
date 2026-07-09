const repoUtils = require("../repositories/utils");

const validateWeekAndPeriod = async (period, dayOfWeek) => {
  const [periods] = await repoUtils.getUtilsByField(
    {
      "utils.key": "PERIOD_OF_DAY",
    },
    false,
    `JSON_EXTRACT(data, "$[*].names.*") as periods`
  );

  const [daysOfWeek] = await repoUtils.getUtilsByField(
    {
      "utils.key": "DAYS_OF_WEEK",
    },
    false,
    `JSON_EXTRACT(data, "$[*].names.*") as days`
  );

  const { days } = daysOfWeek;
  const { periods: periodsList } = periods;

  const existDay = days.find(
    (day) => {
      console.log(day);
      return day.toLowerCase() === dayOfWeek.toLowerCase();
    }
  );

  if (!existDay) {
    throw new Error(`Day of week with name ${dayOfWeek} does not exist`);
  }

  const existPeriod = periodsList.find(
    (p) => p.toLowerCase() === period.toLowerCase()
  );

  if (!existPeriod) {
    throw new Error(`Period with name ${period} does not exist`);
  }

  return { periodName: existPeriod, dayName: existDay };
};

module.exports = validateWeekAndPeriod;
