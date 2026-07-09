require("dotenv").config();
require("dotenv").config({ path: require("path").join(__dirname, "../../.env.orchestrator") });

/**
 * Generate environment variables for orchestrator instances
 * @param {string} instanceName - Name of the AWS instance
 * @param {string} companyId - Company ID for the instance (optional)
 * @returns {string} Environment variables as string
 */
const generateOrchestratorEnv = (instanceName) => {
  const envData = [
    // Core Configuration
    `ENVIRONMENT=${process.env.ORCHESTRATOR_ENVIRONMENT}`,
    `SERVER_NAME=${instanceName}`,
    `ALLOW_SUDO=${process.env.ORCHESTRATOR_ALLOW_SUDO}`,
    `BACK_URL=${process.env.ORCHESTRATOR_BACK_URL}`,
    ``,
    // RabbitMQ Configuration
    `RABBITMQ_USER=${process.env.ORCHESTRATOR_RABBITMQ_USER}`,
    `RABBITMQ_PASS=${process.env.ORCHESTRATOR_RABBITMQ_PASS}`,
    `RABBITMQ_HOST=${process.env.ORCHESTRATOR_RABBITMQ_HOST}`,
    `RABBITMQ_VIRTUAL_HOST=${process.env.ORCHESTRATOR_RABBITMQ_VIRTUAL_HOST}`,
    `RABBITMQ_MAIN_QUEUE=${process.env.ORCHESTRATOR_RABBITMQ_MAIN_QUEUE}`,
    `RABBITMQ_WHATSAPP_QUEUE=${process.env.ORCHESTRATOR_RABBITMQ_WHATSAPP_QUEUE}`,
    ``,
    // Discord Notifications
    `DISCORD_PROCESSOR_WEBHOOK=${process.env.ORCHESTRATOR_DISCORD_PROCESSOR_WEBHOOK}`,
    ``,
    // Docker Configuration
    `CONTAINER_UID_GID=${process.env.ORCHESTRATOR_CONTAINER_UID_GID}`,
    ``,
    // AWS ECR
    `ECR_REGISTRY=${process.env.ORCHESTRATOR_ECR_REGISTRY}`,
    `AWS_REGION=${process.env.ORCHESTRATOR_AWS_REGION}`,
    `AWS_ACCESS_KEY_ID=${process.env.ORCHESTRATOR_AWS_ACCESS_KEY_ID}`,
    `AWS_SECRET_ACCESS_KEY=${process.env.ORCHESTRATOR_AWS_SECRET_ACCESS_KEY}`,
    ``,
    // AWS FILEMANAGER
    `BOT_TOKEN=${process.env.ORCHESTRATOR_BOT_TOKEN}`,
  ];

  return envData.join("\n");
};

module.exports = {
  generateOrchestratorEnv,
};
