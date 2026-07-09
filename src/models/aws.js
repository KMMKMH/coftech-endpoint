require("dotenv").config();
const logger = require("../utils/logger");

const repoBots = require("../repositories/bots");
const repoAWS = require("../repositories/aws");
const { repoBlacklist } = require("../repositories/blacklist");
const repoCompany = require("../repositories/company");
const { generateOrchestratorEnv } = require("../utils/orchestratorEnv");

const { executeSSHCommands } = require("../utils/sshActions");
const { sendMessageToChannel } = require("../utils/discordConnection");
const { discordEmbeds } = require("../utils/discordTemplates");

const createMachine = async (bundleID, companyID = null) => {
  try {
    const instance_name = `coftech-${Date.now()}`;

    let company = null;
    if (companyID) {
      const [companyData] = await repoCompany.getCompanyByField({
        "company.uuid_unique": companyID,
      });

      if (!companyData) {
        throw new Error(`Company with ID ${companyID} not found`);
      }

      company = {
        name: companyData.name,
        uuid_unique: companyData.uuid_unique,
      };
    }

    const response = await repoAWS.awsCreateMachine(
      instance_name,
      bundleID,
      company,
    );
    await waitForInstanceState(instance_name, "running");

    const instanceInfo = await repoAWS.awsGetInstance({
      instanceName: instance_name,
    });
    const publicIp = instanceInfo.publicIpAddress;

    await repoAWS.saveInstance({ name: instance_name });

    const webhookID = getAwsWebhookId();
    await sendMessageToChannel(webhookID, {
      embeds: [discordEmbeds.machineCreated(instance_name)],
    });

    const ports = [
      { fromPort: 22, toPort: 22, protocol: "tcp" },
      { fromPort: 6333, toPort: 6333, protocol: "tcp" },
      { fromPort: 6334, toPort: 6334, protocol: "tcp" },
    ];
    await repoAWS.awsPutPorts(instance_name, ports);

    const envData = generateOrchestratorEnv(instance_name);

    const scriptCommand = `sudo bash -c 'cat > /home/ubuntu/coftech/script.sh <<EOF
#!/bin/bash
export SSH_AUTH_SOCK=$(find /tmp/ -name agent.* -user $USER -printf "%T@ %p\\n" 2>/dev/null | sort -nk1 | tail -n 1 | cut -d" " -f2)
cd /home/ubuntu/coftech/orchestrator && sudo git checkout -f && sudo git clean -fd && sudo git pull && sudo npm install
sudo pm2 restart all
EOF'`;

    const commands = [
      'sudo DEBIAN_FRONTEND=noninteractive apt-get update && sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -o Dpkg::Options::="--force-confnew"',
      "sudo apt install software-properties-common gnupg apt-transport-https ca-certificates -y",
      "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
      "sudo apt update",
      "sudo apt upgrade -y",
      "sudo apt install snapd -y",
      "sudo apt-get install -y nodejs",
      "sudo apt-get install -y git",
      "sudo npm install pm2 -g",
      "sudo apt-get install gnupg curl -y",
      "sudo apt-get install zip unzip",
      "curl -fsSL https://get.docker.com -o get-docker.sh",
      "sudo sh get-docker.sh",
      "sudo rm get-docker.sh",
      "sudo usermod -aG docker ubuntu",
      "sudo systemctl start docker",
      "sudo systemctl enable docker",
      "sudo mkdir -p /home/ubuntu/coftech/orchestrator",
      `sudo git clone ${process.env.GITHUB_REPO_CLONE}@github.com/coftech-bot/coftech-orchestrator.git /home/ubuntu/coftech/orchestrator`,
      `cd /home/ubuntu/coftech/orchestrator && sudo npm install`,
      `sudo echo "${envData}" | sudo tee /home/ubuntu/coftech/orchestrator/.env`,
      `sleep 10`,
      `cd /home/ubuntu/coftech/orchestrator && sudo pm2 start ./src/app.js --name orchestrator --time`,
      `sudo pm2 startup`,
      `sudo pm2 save`,
      scriptCommand,
      `sudo chmod +x /home/ubuntu/coftech/script.sh`,
    ];

    await executeSSHCommands(publicIp, commands);

    return {
      instance_name,
      publicIp,
      response,
    };
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};

async function waitForInstanceState(
  instance_name,
  desiredState,
  timeout = 60000,
  interval = 5000,
) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const instanceInfo = await repoAWS.awsGetInstance({
        instanceName: instance_name,
      });
      if (instanceInfo.state.name === desiredState) {
        logger.info(
          `Instance ${instance_name} reach status ${desiredState} in ${
            Date.now() - startTime
          } ms.`,
        );
        return;
      }
    } catch (error) {
      logger.error(`Error getting instance: ${instance_name},`, error);
      throw new Error("Error generating machine status");
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  logger.error(
    `Instance ${instance_name} did not reach the ${desiredState} state before the timeout.`,
  );
  throw new Error(
    `Instance ${instance_name} did not reach the ${desiredState} state before the timeout.`,
  );
}

const awsGetIP = async (instanceID) => {
  try {
    const [instanceField] = await repoAWS.getInstanceByField({
      "aws_instances.uuid_unique": instanceID,
    });
    if (!instanceField) {
      throw new Error(`Instance ID ${instanceID} not found`);
    }

    const { name: instanceName } = instanceField;

    const instanceInfo = await repoAWS.awsGetInstance({
      instanceName: instanceName,
    });

    return instanceInfo.publicIpAddress;
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};

const instanceReady = async (instanceName) => {
  try {
    const [awsInstance] = await repoAWS.getInstanceByField({
      "aws_instances.name": instanceName,
    });
    if (!awsInstance) {
      throw new Error(`Instance with Name ${instanceName} not found`);
    }

    const [botInstance] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.instance_id": awsInstance.uuid_unique,
    });
    if (!botInstance) {
      throw new Error(`Instance with Name ${instanceName} has no bots`);
    }

    return botInstance.uuid_unique;
  } catch (error) {
    throw new Error(error);
  }
};

const deleteMachine = async (instanceName) => {
  try {
    const [instanceField] = await repoAWS.getInstanceByField({
      "aws_instances.name": instanceName,
    });
    if (!instanceField) {
      throw new Error(`Instance with name ${instanceName} not found`);
    }
    const { uuid_unique: instanceID } = instanceField;

    const dataInstanceBots = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.instance_id": instanceID,
    });

    let existsInAWS = false;
    try {
      logger.info(`Checking if instance ${instanceName} exists in AWS`);
      await repoAWS.awsGetInstance({ instanceName });
      existsInAWS = true;
      logger.info(`Instance ${instanceName} found in AWS`);
    } catch (awsError) {
      logger.warn(
        `Instance ${instanceName} not found in AWS: ${awsError.message}`,
      );
      logger.info(`Will proceed to clean up database records only`);
    }

    if (existsInAWS) {
      logger.info(`Deleting instance ${instanceName} from AWS`);
      await repoAWS.deleteMachine(instanceName);
      logger.info(`Instance ${instanceName} successfully deleted from AWS`);
    }

    if (dataInstanceBots.length > 0) {
      logger.info(
        `Cleaning up ${dataInstanceBots.length} bots for instance ${instanceName}`,
      );
      for (const bot of dataInstanceBots) {
        const { bot_id: botID } = bot;
        await repoAWS.deleteInstanceBot({
          "aws_instances_bots.instance_id": instanceID,
          "aws_instances_bots.bot_id": botID,
        });
        await repoBlacklist.delete({
          "blacklist.bot_id": botID,
        });
        await repoBots.updateBot(
          { "bots.uuid_unique": botID },
          { "bots.status": false, "bots.suspended": true },
        );
      }
    }

    await repoAWS.deleteInstance({ "aws_instances.uuid_unique": instanceID });
    logger.info(
      `Instance ${instanceName} and related data successfully deleted from database`,
    );

    const webhookID = getAwsWebhookId();

    await sendMessageToChannel(webhookID, {
      embeds: [discordEmbeds.machineDeleted(instanceName)],
    });

    return {
      success: true,
      instanceName,
      botsAffected: dataInstanceBots.length,
      deletedFromAWS: existsInAWS,
      wasOrphan: !existsInAWS,
    };
  } catch (error) {
    logger.error(`Error deleting instance ${instanceName}: ${error.message}`);
    throw new Error(
      `Failed to delete instance ${instanceName}: ${error.message}`,
    );
  }
};

const updateBotInstance = async (instanceID, botID) => {
  try {
    logger.info(
      `Updating bot instance with data: ${JSON.stringify({
        instanceID,
        botID,
      })}`,
    );
    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot with ID ${botID} not found`);
    }

    const [targetInstanceField] = await repoAWS.getInstanceByField({
      "aws_instances.uuid_unique": instanceID,
    });

    if (!targetInstanceField) {
      throw new Error(`Instance with ID ${instanceID} not found`);
    }

    let sourceInstanceName = "N/A";
    const [currentInstanceBot] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });

    if (currentInstanceBot) {
      const [sourceInstanceField] = await repoAWS.getInstanceByField({
        "aws_instances.uuid_unique": currentInstanceBot.instance_id,
      });
      if (sourceInstanceField) {
        sourceInstanceName = sourceInstanceField.name;
      }
    }

    const result = await repoAWS.updateBotInstance(
      { "aws_instances_bots.bot_id": botID },
      { "aws_instances_bots.instance_id": instanceID },
    );

    const webhookID = getAwsWebhookId();
    await sendMessageToChannel(webhookID, {
      embeds: [
        discordEmbeds.botMigrated(
          botField.uuid_unique,
          botField.name,
          botField.company_name || "N/A",
          sourceInstanceName,
          targetInstanceField.name,
        ),
      ],
    });

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const getAwsWebhookId = () => {
  return process.env.ENVIRONMENT === "development" ||
    process.env.ENVIRONMENT === "test"
    ? process.env.DISCORD_AWS_TEST
    : process.env.DISCORD_AWS_PROD;
};

module.exports = {
  createMachine,
  instanceReady,
  updateBotInstance,
  deleteMachine,
  awsGetIP,
};
