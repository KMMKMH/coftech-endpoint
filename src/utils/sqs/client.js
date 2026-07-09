const { SQSClient, GetQueueAttributesCommand } = require("@aws-sdk/client-sqs");
const logger = require("../logger");

const sqsClient = new SQSClient({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN && {
      sessionToken: process.env.AWS_SESSION_TOKEN,
    }),
  },
});

const getQueueArn = async (queueUrl) => {
  try {
    const command = new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ["QueueArn"],
    });
    return (await sqsClient.send(command)).Attributes?.QueueArn;
  } catch (error) {
    logger.error(`Error getting SQS Queue ARN: ${error.message}`);
    throw new Error(error);
  }
};

module.exports = {
  sqsClient,
  getQueueArn,
};
