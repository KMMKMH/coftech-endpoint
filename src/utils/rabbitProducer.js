let rabbitMQInstance = null;

const getRabbitMQProducer = async () => {
  if (!rabbitMQInstance) {
    const RabbitMQ = require("./rabbitMQ");
    rabbitMQInstance = new RabbitMQ({ type: "PRODUCER" });
    await rabbitMQInstance.connect();
  }
  return rabbitMQInstance;
};

module.exports = { getRabbitMQProducer };