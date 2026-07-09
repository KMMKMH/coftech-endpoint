const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const logger = require("../logger");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.templateCache = {};
  }

  async initialize(config = {}) {
    if (this.initialized) return;

    const user = config.user || process.env.EMAIL_USER;  
    const pass = config.password || process.env.EMAIL_PASSWORD;  

    logger.info("Initializing email service with:");
    logger.info(`  User: ${user}`);

    const defaultConfig = {
      host: config.host || "smtp.gmail.com",
      port: config.port || 465,
      secure: config.secure || true,
      auth: { user, pass },
    };

    this.transporter = nodemailer.createTransport(defaultConfig);

    try {
      await this.transporter.verify();
      this.initialized = true;
      logger.info("Email service initialized successfully");
    } catch (error) {
      logger.error("Error initializing email service:", error);
      throw error;
    }
  }

  loadTemplate(templateName) {
    if (this.templateCache[templateName]) {
      return this.templateCache[templateName];
    }

    const templatePath = path.join(
      __dirname,  
      `${templateName}.hbs`
    );

    const templateSource = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(templateSource);

    this.templateCache[templateName] = template;

    return template;
  }

  async sendEmail(options) {
    if (!this.initialized) {
      await this.initialize();
    }

    const mailOptions = {
      from: `"CoftechBot" <${options.from || process.env.EMAIL_FROM}>`,  
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments || [],
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error("Error sending email:", error);
      throw error;
    }
  }

  async sendTemplateEmail(to, templateName, data, subject) {
    const template = this.loadTemplate(templateName);
    const html = template(data);

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendNotification(options) {
    const { type, service, details, recipients, botName } = options;
    let subject = "";
    let templateData = {};

    switch (type) {
    case "disconnection":
      subject = "WhatsApp Bot Disconnected";
      templateData = {
        title: "The WhatsApp bot has disconnected",
        message: `A disconnection was detected for WhatsApp bot ${botName}.`,
        details: details || "Manual reconnection is required.",
        caseimage:{
          width: "150",
          url:"https://coftech-media-store.s3.us-east-1.amazonaws.com/notifications/disconnection.png",
        },
        timestamp: new Date().toLocaleString(),
      };
      break;
    case "no-credits":
      subject = `No credits remaining in ${service}`;
      templateData = {
        title: `No credits remaining in ${service}`,
        message: `The ${service} service associated with bot ${botName} has run out of credits. The bot has been suspended because of this.`,
        caseimage: {
          url: "https://coftech-media-store.s3.us-east-1.amazonaws.com/notifications/no-credits.png",
          width: "150",
        },
        timestamp: new Date().toLocaleString(),
      };
      break;
    case "server-error":
      subject = "An error was detected";
      templateData = {
        title: `An error was detected`,
        message: `An error was detected for bot ${botName}.`,
        details: details || "Manual reconnection is required.",
        caseimage: {
          url: "https://coftech-media-store.s3.us-east-1.amazonaws.com/notifications/error.png",
          width: "150",
        },
        timestamp: new Date().toLocaleString(),
      };
      break;
    case "invalid-api-key":
      subject = `Invalid API key entered for ${service}`;
      templateData = {
        title: `Invalid ${service} API key`,
        message: `Invalid API key entered for ${service}.`,
        details: details || "Verification is required.",
        caseimage: {
          url: "https://coftech-media-store.s3.us-east-1.amazonaws.com/notifications/error.png",
          width: "150",
        },
        timestamp: new Date().toLocaleString(),
      };
      break;
    default:
      subject = "System Notification";
      templateData = {
        title: "System Notification",
        message:
          options.message || "A system alert has been generated.",
        details:
          details || "Review the admin dashboard for more details.",
        timestamp: new Date().toLocaleString(),
      };
    }
    return this.sendTemplateEmail(
      recipients || process.env.ADMIN_EMAIL,  
      "notification",
      templateData,
      subject
    );
  }
}

const emailService = new EmailService();
module.exports = emailService;
