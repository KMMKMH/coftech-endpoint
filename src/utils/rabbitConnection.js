const RabbitMQ = require("./rabbitMQ");

const rabbitMQ = new RabbitMQ({ type: "CONSUMER" });

const setup = async () => {
  try {
    await rabbitMQ.connect();

    console.log("[+] RabbitMQ setup complete");
  } catch (error) {
    console.error("[-] Failed to setup RabbitMQ", error);
    await rabbitMQ.close();
  }
};

module.exports = { setup };
