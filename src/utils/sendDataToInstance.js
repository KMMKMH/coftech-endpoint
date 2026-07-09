const { getRabbitMQProducer } = require("./rabbitProducer");

async function sendDataToInstance(instanceName, event, payload) {
  try {
    const rabbitMQ = await getRabbitMQProducer();
    await rabbitMQ.send(instanceName, {
      event,
      payload,
    });
  } catch (error) {
    throw new Error("SendDataToInstance", { cause: error });
  }
}

module.exports = { sendDataToInstance };
