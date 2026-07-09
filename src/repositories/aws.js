const db = require("../utils/db");
const logger = require("../utils/logger");
const { lightsailClient } = require("../utils/AWSClient");
const {
  CreateInstancesCommand,
  GetInstanceCommand,
  GetInstancesCommand,
  PutInstancePublicPortsCommand,
  DeleteInstanceCommand,
  RebootInstanceCommand,
} = require("@aws-sdk/client-lightsail");

const getInstanceByField = async (data, isRaw = false) => {
  try {
    const query = db("aws_instances");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting aws_instances with data: ${JSON.stringify(
        data,
      )} ${isRaw}, error: ${JSON.stringify(e)}`,
    );
    throw new Error(`Error getting aws_instances data`);
  }
};

const getInstanceBotsByField = async (data, isRaw = false) => {
  try {
    const query = db("aws_instances_bots")
      .select("aws_instances_bots.*")
      .select("aws_instances.name AS instance_name")
      .leftJoin(
        "aws_instances",
        "aws_instances_bots.instance_id",
        "aws_instances.uuid_unique",
      );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting aws_instances_bots with data: ${JSON.stringify(
        data,
      )} ${isRaw}, error: ${JSON.stringify(e)}`,
    );
    throw new Error(`Error getting aws_instances_bots data`);
  }
};

const saveInstance = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    return await db("aws_instances").insert(data);
  } catch (e) {
    throw new Error(`Error saving aws_instances: ${e}`);
  }
};

const awsGetInstance = async (instance = {}) => {
  try {
    let command;
    if (instance?.instanceName) {
      command = new GetInstanceCommand({ instanceName: instance.instanceName });
    } else {
      command = new GetInstancesCommand(instance);
    }
    const response = await lightsailClient.send(command);

    const existInstance = await getInstanceByField(
      instance?.instanceName ? { name: instance.instanceName } : {},
    );

    const isBotInstance = !!(
      response?.instance &&
      Array.isArray(response.instance.tags) &&
      response.instance.tags.some((tag) =>
        tag.key.toLowerCase().startsWith("bot"),
      )
    );

    if (Array.isArray(response?.instances)) {
      let allInstances = response.instances;
      let nextPageToken = response.nextPageToken;

      while (nextPageToken) {
        const paginatedCommand = new GetInstancesCommand({
          ...instance,
          pageToken: nextPageToken,
        });
        const paginatedResponse = await lightsailClient.send(paginatedCommand);

        if (Array.isArray(paginatedResponse?.instances)) {
          allInstances = allInstances.concat(paginatedResponse.instances);
        }

        nextPageToken = paginatedResponse.nextPageToken;
      }

      return allInstances
        .filter(
          (curr) =>
            Array.isArray(curr.tags) &&
            curr.tags.some(
              (tag) => tag.key && tag.key.toLowerCase().startsWith("bot"),
            ),
        )
        .reduce((acc, curr) => {
          const matched = existInstance.find((item) => item.name === curr.name);
          if (matched) {
            acc.push({
              ...curr,
              instanceID: matched.uuid_unique,
            });
          } else {
            acc.push(curr);
          }
          return acc;
        }, []);
    } else if (isBotInstance) {
      const instanceData = response.instance;
      const instanceID =
        existInstance.length > 0 ? existInstance[0].uuid_unique : null;

      return {
        ...instanceData,
        instanceID,
      };
    }
  } catch (e) {
    logger.error(
      `Error getting awsGetInstance with data: ${JSON.stringify(
        instance,
      )}, error: ${JSON.stringify(e)}`,
    );
    if (e?.message) {
      throw new Error(e.message);
    } else {
      throw new Error(`Error getting awsGetInstance data`);
    }
  }
};

const awsPutPorts = async (instanceName, ports) => {
  try {
    const params = {
      instanceName: instanceName,
      portInfos: ports,
    };

    const command = new PutInstancePublicPortsCommand(params);
    return await lightsailClient.send(command);
  } catch (e) {
    logger.error(
      `Error putting aws ports with instance name: ${instanceName}, with ports ${ports}, error: ${JSON.stringify(
        e,
      )}`,
    );
    throw new Error(`Error putting aws ports data`);
  }
};

const awsCreateMachine = async (instance_name, bundleID, company = null) => {
  try {
    const tags = [
      { key: "Bot", value: "" },
      {
        key: "environment",
        value:
          process.env.ENVIRONMENT !== "production"
            ? "development"
            : "production",
      },
    ];

    if (company) {
      tags.push(
        { key: "CompanyName", value: company.name || "" },
        { key: "CompanyId", value: company.uuid_unique || "" },
      );
    }

    const params = {
      instanceNames: [instance_name],
      availabilityZone: "us-east-1a",
      blueprintId: "ubuntu_22_04",
      bundleId: bundleID,
      keyPairName: process.env.AWS_LIGHTSAIL_KEY_PAIR_NAME,
      tags: tags,
    };

    const command = new CreateInstancesCommand(params);
    return await lightsailClient.send(command);
  } catch (e) {
    logger.error(
      `Error making aws machine with data: ${JSON.stringify(
        instance_name,
      )} ${bundleID}, error: ${JSON.stringify(e)}`,
    );
    throw new Error(`Error making aws machine data`);
  }
};

const getInstancesBalancer = async (maxBots = 2) => {
  try {
    const query = db("aws_instances as ai")
      .leftJoin(
        "aws_instances_bots as aib",
        "ai.uuid_unique",
        "aib.instance_id",
      )
      .select("ai.*")
      .count("aib.uuid_unique as bots_count")
      .groupBy("ai.uuid_unique")
      .having("bots_count", "<=", maxBots);

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting instances balancer with data: ${maxBots}, error: ${JSON.stringify(
        e,
      )}`,
    );
    throw new Error(`Error getting instances balancer data`);
  }
};

const saveBotInstance = async (data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    return await db("aws_instances_bots").insert(data);
  } catch (e) {
    throw new Error(`Error saving bot instance: ${e}`);
  }
};

const deleteMachine = async (machine) => {
  try {
    const command = new DeleteInstanceCommand({ instanceName: machine });
    logger.info(`Deleting machine ${machine}`);
    return await lightsailClient.send(command);
  } catch (e) {
    logger.error(
      `Error deleting AWS Machine with data: ${JSON.stringify(
        machine,
      )}, error: ${JSON.stringify(e)}`,
    );
    throw new Error(`Error deleting AWS Machine data`);
  }
};

const deleteInstance = async (data) => {
  try {
    logger.info(`Deleting instance with data: ${JSON.stringify(data)}`);
    return await db("aws_instances").where(data).del();
  } catch (error) {
    logger.error(
      `Error deleting AWS Instance with data: ${JSON.stringify(
        data,
      )}, error: ${JSON.stringify(error)}`,
    );
    throw new Error(`Error deleting AWS Instance data`);
  }
};
const deleteInstanceBot = async (data) => {
  try {
    logger.info(`Deleting instance bot with data: ${JSON.stringify(data)}`);
    return await db("aws_instances_bots").where(data).del();
  } catch (error) {
    logger.error(
      `Error deleting AWS instance bot with data: ${JSON.stringify(
        data,
      )}, error: ${JSON.stringify(error)}`,
    );
    throw new Error(`Error deleting AWS instance bot data`);
  }
};

const updateBotInstance = async (where, data) => {
  try {
    logger.info(`Updating bot instance with data: ${JSON.stringify(data)}`);
    return await db("aws_instances_bots").where(where).update(data);
  } catch (e) {
    logger.error(
      `Error in updateBotInstance with data: ${JSON.stringify({
        where,
        data,
      })}, error: ${JSON.stringify(e)}`,
    );
    throw e;
  }
};

const restartInstance = async (instanceName) => {
  try {
    await awsGetInstance({ instanceName });

    logger.info(`Restarting instance ${instanceName}`);
    return await lightsailClient.send(
      new RebootInstanceCommand({ instanceName }),
    );
  } catch (error) {
    logger.error(
      `Error in restartInstance with instanceName ${instanceName}, error: ${JSON.stringify(error)}`,
    );
    throw error;
  }
};

module.exports = {
  awsCreateMachine,
  awsGetInstance,
  awsPutPorts,
  getInstanceBotsByField,
  getInstanceByField,
  saveInstance,
  getInstancesBalancer,
  saveBotInstance,
  deleteMachine,
  deleteInstance,
  deleteInstanceBot,
  updateBotInstance,
  restartInstance,
};
