const {
  CreateScheduleCommand,
  UpdateScheduleCommand,
  DeleteScheduleCommand,
  CreateScheduleGroupCommand,
  GetScheduleGroupCommand,
  SchedulerClient,
} = require("@aws-sdk/client-scheduler");

const logger = require("./logger");

const environment = process.env.ENVIRONMENT;

const scheduler = new SchedulerClient({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Creates a group if it does not exist
 * @param {string} environment - dev or prod
 */
async function ensureScheduleGroup() {
  const groupName = `${environment}-schedules`;

  try {
    await scheduler.send(new GetScheduleGroupCommand({ Name: groupName }));
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      await scheduler.send(
        new CreateScheduleGroupCommand({
          Name: groupName,
          Tags: [
            { Key: "Environment", Value: environment },
            { Key: "Project", Value: "coftech-bot" },
          ],
        })
      );
      logger.info(`Schedule group created: ${groupName}`);
    }
  }
}

/**
 * Creates or updates the EventBridge schedule
 * @param {Object} params
 * @param {string|number} params.botID - Bot ID
 * @param {string} params.groupName - WhatsApp group name
 * @param {string} params.timezone - Bot timezone
 * @param {string} params.cron - Cron expression
 * @param {string} params.environment - dev or prod
 */
async function updateEventBridgeRule({
  botID,
  companyID,
  groupName,
  timezone,
  cron,
}) {
  const scheduleName = `coftech-${botID}`;
  const scheduleGroupName = `${environment}-schedules`;

  await ensureScheduleGroup(environment);

  const lambdaArn =
    environment === "production"
      ? process.env.AWS_LAMBDA_REPORT_PROD_ARN
      : process.env.AWS_LAMBDA_REPORT_DEV_ARN;

  const scheduleParams = {
    Name: scheduleName,
    GroupName: scheduleGroupName,
    ScheduleExpression: `cron(${formatCron(cron)})`,
    ScheduleExpressionTimezone: timezone,
    State: "ENABLED",
    Description: `Weekly report for bot ${botID} - ${environment}`,
    Target: {
      Arn: lambdaArn,
      RoleArn: process.env.AWS_EVENTBRIDGE_ROLE_ARN,
      Input: JSON.stringify({
        botID,
        companyID,
        groupName,
        timezone,
        environment,
      }),
    },
    FlexibleTimeWindow: {
      Mode: "OFF",
    },
  };

  // Try to update or create with retry handling for ConflictException
  let lastError;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await scheduler.send(new UpdateScheduleCommand(scheduleParams));
      logger.info(`Schedule updated: ${scheduleName} in ${scheduleGroupName}`);
      return;
    } catch (err) {
      lastError = err;

      if (err.name === "ResourceNotFoundException") {
        try {
          await scheduler.send(new CreateScheduleCommand(scheduleParams));
          logger.info(`Schedule created: ${scheduleName} in ${scheduleGroupName}`);
          return;
        } catch (createErr) {
          if (createErr.name === "ConflictException" && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 100;
            logger.warn(`ConflictException creating ${scheduleName}, retrying in ${delay}ms (${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw createErr;
        }
      } else if (err.name === "ConflictException" && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 100;
        logger.warn(`ConflictException updating ${scheduleName}, retrying in ${delay}ms (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}

/**
 * Deletes the EventBridge schedule
 * @param {string|number} botID - Bot ID
 */
async function deleteEventBridgeRule(botID) {
  const scheduleName = `coftech-${botID}`;
  const scheduleGroupName = `${environment}-schedules`;

  try {
    await scheduler.send(
      new DeleteScheduleCommand({
        Name: scheduleName,
        GroupName: scheduleGroupName,
      })
    );
    logger.info(`Schedule deleted: ${scheduleName} from ${scheduleGroupName}`);
  } catch (err) {
    if (!err.name.includes("ResourceNotFoundException")) throw err;
  }
}

const formatCron = (cron) => {
  const parts = cron.split(" ");
  if (parts.length !== 5) return cron;

  const [min, hour, dayMonth, month, dayWeek] = parts;

  let awsDayWeek = dayWeek;
  if (dayWeek !== "*" && dayWeek !== "?") {
    const day = Number(dayWeek);
    awsDayWeek = day === 0 ? "1" : String(day + 1);
  }

  if (awsDayWeek !== "*" && awsDayWeek !== "?") {
    return `${min} ${hour} ? ${month} ${awsDayWeek} *`;
  } else if (dayMonth !== "*") {
    return `${min} ${hour} ${dayMonth} ${month} ? *`;
  } else {
    return `${min} ${hour} ${dayMonth} ${month} ? *`;
  }
};

module.exports = { updateEventBridgeRule, deleteEventBridgeRule };
