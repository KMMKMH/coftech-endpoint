const amqp = require("amqplib");
const { handleMainEvents } = require("./rabbit/mainEvents");
const { handleWhatsappEvents } = require("./rabbit/whatsappEvents");

const user = process.env.RABBITMQ_USER;  
const pass = process.env.RABBITMQ_PASS;  
const host = process.env.RABBITMQ_HOST;  
const vhost = process.env.RABBITMQ_VIRTUAL_HOST;  

class RabbitMQ {
  constructor({ type }) {
    if (type != "CONSUMER" && type != "PRODUCER") {
      throw new Error("Invalid type. Must be 'CONSUMER' or 'PRODUCER'.");
    }

    this.url = `amqp://${user}:${pass}@${host}/${vhost}?frameMax=8192&heartbeat=320`;
    this.type = type;
    this.connection = null;
    this.producer = null;
    this.consumer = null;
    this.isConnecting = false;
    this.reconnectDelay = 5000;
    this.maxReconnectDelay = 30000;
    this.queues = {
      MAIN: process.env.RABBITMQ_MAIN_QUEUE,  
      WHATSAPP: process.env.RABBITMQ_WHATSAPP_QUEUE,  
    };
  }

  async connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.connection = await amqp.connect(this.url);
      
      this.connection.on("error", (error) => {
        console.error("[-] RabbitMQ connection error:", error);
        this.connection = null;
        this.producer = null;
        this.consumer = null;
      });
      
      this.connection.on("close", () => {
        console.error("[-] RabbitMQ connection closed. Attempting to reconnect...");
        this.connection = null;
        this.producer = null;
        this.consumer = null;
        this.scheduleReconnect();
      });

      await this.setupChannels();
      this.reconnectDelay = 5000;
      this.isConnecting = false;
      console.log(`[+] RabbitMQ connection established as ${this.type}.`);
      
    } catch (error) {
      this.isConnecting = false;
      console.error("[-] Failed to connect to RabbitMQ:", error);
      this.scheduleReconnect();
    }
  }

  async setupChannels() {
    try {
      if (this.type === "PRODUCER") {
        this.producer = await this.connection.createChannel();
        this.producer.on("error", (error) => {
          console.error("[-] Producer channel error:", error);
          this.producer = null;
        });
        this.producer.on("close", () => {
          console.log("[-] Producer channel closed");
          this.producer = null;
        });
      }

      if (this.type === "CONSUMER") {
        this.consumer = await this.connection.createChannel();
        this.consumer.on("error", (error) => {
          console.error("[-] Consumer channel error:", error);
          this.consumer = null;
        });
        this.consumer.on("close", () => {
          console.log("[-] Consumer channel closed");
          this.consumer = null;
        });
        this.consume(this.queues.MAIN, handleMainEvents)
        this.hearExchange(this.queues.WHATSAPP, handleWhatsappEvents)
      }
    } catch (error) {
      console.error("[-] Failed to setup channels:", error);
      throw error;
    }
  }

  scheduleReconnect() {
    if (this.isConnecting) return;
    
    setTimeout(() => {
      console.log(`[*] Attempting to reconnect in ${this.reconnectDelay}ms...`);
      this.connect();
    }, this.reconnectDelay);

    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  async ensureConnection() {
    if (!this.connection || !this.isChannelReady()) {
      await this.connect();
    }
  }

  isChannelReady() {
    return this.type === "PRODUCER" ? this.producer : this.consumer;
  }

  async send(queue, message) {
    if (this.type !== "PRODUCER") {
      console.error("[-] RabbitMQ is not initialized as a producer.");
      return;
    }

    await this.ensureConnection();
    
    if (!this.producer) {
      console.error("[-] Producer channel is not available.");
      return;
    }

    try {
      await this.producer.assertQueue(queue, { durable: true });
      this.producer.sendToQueue(queue, Buffer.from(JSON.stringify(message)));  
    } catch (error) {
      console.error("[-] Failed to send message:", error);
      this.producer = null;
      throw error;
    }
  }

  async consume(queue, onMessage) {
    if (this.type !== "CONSUMER") {
      console.error("[-] RabbitMQ is not initialized as a consumer.");
      return;
    }

    await this.ensureConnection();
    
    if (!this.consumer) {
      console.error("[-] Consumer channel is not available.");
      return;
    }

    try {
      await this.consumer.assertQueue(queue, { durable: true });
      await this.consumer.consume(
        queue,
        async (msg) => {
          if (msg !== null) {
            try {
              this.consumer.ack(msg);
              await onMessage(JSON.parse(msg.content.toString()));
            } catch (msgError) {
              console.error("[-] Error processing message:", msgError);
            }
          }
        },
        {
          noAck: false,
        }
      );
    } catch (error) {
      console.error("[-] Failed to consume messages:", error);
      this.consumer = null;
      throw error;
    }
  }

  async hearExchange(exchange, onMessage) {
    if (this.type !== "CONSUMER") {
      console.error("[-] RabbitMQ is not initialized as a consumer.");
      return;
    }

    await this.ensureConnection();
    
    if (!this.consumer) {
      console.error("[-] Consumer channel is not available.");
      return;
    }

    try {
      await this.consumer.assertExchange(exchange, "fanout", { durable: true });
      const q = await this.consumer.assertQueue("", { exclusive: true });

      await this.consumer.bindQueue(q.queue, exchange, "");
      await this.consumer.consume(
        q.queue,
        async (msg) => {
          if (msg !== null) {
            try {
              this.consumer.ack(msg);
              await onMessage(JSON.parse(msg.content.toString()));
            } catch (msgError) {
              console.error("[-] Error processing message:", msgError);
            }
          }
        },
        {
          noAck: false,
        }
      );
    } catch (error) {
      console.error("[-] Failed to consume messages:", error);
      this.consumer = null;
    }
  }

  async clearQueue(queue) {
    if (this.type !== "CONSUMER") {
      console.error("[-] RabbitMQ is not initialized as a consumer.");
      throw new Error("Consumer is not initialized.");
    }

    await this.ensureConnection();
    
    if (!this.consumer) {
      console.error("[-] Consumer channel is not available.");
      throw new Error("Consumer channel is not available.");
    }

    try {
      await this.consumer.assertQueue(queue, { durable: true });

      let queueLength = 0;
      const consumerTag = await this.consumer.consume(
        queue,
        (msg) => {
          if (msg !== null) {
            this.consumer.ack(msg);
            queueLength++;
          }
        },
        {
          noAck: false,
        }
      );

      await this.consumer.cancel(consumerTag.consumerTag);
      return queueLength;
    } catch (error) {
      console.error("[-] Failed to clear queue:", error);
      this.consumer = null;
      throw error;
    }
  }

  async close() {
    try {
      if (this.producer) {
        await this.producer.close();
      }
      if (this.consumer) {
        await this.consumer.close();
      }
      if (this.connection) {
        await this.connection.close();
      }

      console.log("[+] Connection to RabbitMQ closed");
    } catch (error) {
      console.error("[-] Failed to close connection:", error);
      throw error;
    }
  }
}

module.exports = RabbitMQ;
