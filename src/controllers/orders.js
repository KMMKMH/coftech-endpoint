const Joi = require("joi");
const logger = require("../utils/logger");
const modelOrders = require("../models/orders");
const modelsBots = require("../models/bots");
const modelAWS = require("../models/aws");
const repoOrders = require("../repositories/orders");
const repoAccount = require("../repositories/accounts");
const { socialNetworksRepository } = require("../repositories/social");
const repoAWS = require("../repositories/aws");

const { sendMessageToChannel } = require("../utils/discordConnection");

const saveOrders = async (req, res) => {
  try {
    const bodyType = req.header("X-Body-Type");
    const body = req.body;

    let response;

    const bodySchema = Joi.object({
      transaction_id: Joi.string(),
      event_body: Joi.object({
        transaction_id: Joi.string().required(),
      }).unknown(true),
    }).unknown(true);

    const { error: bodyError } = bodySchema.validate(body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const [orderField] = await repoOrders.getOrderByField({
      transaction_id: body.transaction_id || body.event_body.transaction_id,
    });
    if (!orderField) {
      logger.info(`The order no has be created`);
    }

    if (
      (orderField &&
        Object.keys(orderField).some(
          (prop) => orderField[prop] === null || orderField[prop] === undefined
        )) ||
      (bodyType === "NMI-Body-Type" &&
        body.event_type.includes("transaction.refund") &&
        orderField.extra4.includes("unsolicited"))
    ) {
      logger.info(`The order has be created`);

      if (bodyType === "NMI-Body-Type") {
        const data = body.event_type.includes("transaction.refund")
          ? { extra4: JSON.stringify(body) }
          : { extra3: JSON.stringify(body) };
        response = await modelOrders.updateOrder(
          orderField.uuid_unique,
          bodyType,
          {
            status: body.event_body.action.response_text,
            reason: body.event_type,
            ...data,
          }
        );
      }

      if (bodyType === "Woo-Body-Type") {
        const newStatus =
          orderField.status === "checkout-draft"
            ? "processing"
            : orderField.status;
        const data =
          body.status === "checkout-draft"
            ? { extra1: JSON.stringify(body) }
            : { extra2: JSON.stringify(body) };

        response = await modelOrders.updateOrder(
          orderField.uuid_unique,
          bodyType,
          {
            status: newStatus,
            item: body.line_items[0].sku,
            ...data,
          }
        );
      }
    }

    if (bodyType === "NMI-Body-Type" && !orderField) {
      const bodySchema = Joi.object({
        event_body: Joi.object({
          transaction_id: Joi.string().required(),
          requested_amount: Joi.string().required(),
          action: Joi.object({
            amount: Joi.string().required(),
          }).unknown(true),
          billing_address: Joi.object({
            email: Joi.string().email().required(),
          }).unknown(true),
        })
          .required()
          .unknown(true),
        event_type: Joi.string().required(),
      })
        .custom((value, helpers) => {
          if (
            value.event_body.requested_amount !== value.event_body.action.amount
          ) {
            return helpers.message(
              '"event_body.action.amount" must be equal to "event_body.requested_amount"'
            );
          }
          return value;
        }, "Custom Validation")
        .unknown(true);

      const { error: bodyError } = bodySchema.validate(body);
      if (bodyError) {
        throw new Error(bodyError.details[0].message);
      }

      const paymentEmail = body.event_body.billing_address.email;

      const [accountField] = await repoAccount.getAccountByField({
        "accounts.email": paymentEmail,
      });
      if (!accountField) {
        throw new Error(`Account not found`);
      }

      const channelID =
        process.env.ENVIRONMENT == "development" ||
        process.env.ENVIRONMENT == "test"
          ? process.env.DISCORD_PAYMENTS_TEST
          : process.env.DISCORD_PAYMENTS_PROD;

      sendMessageToChannel(channelID, {
        message: `New payment from ${paymentEmail}, transaction: ${body.event_body.transaction_id}`,
      });

      if (accountField.phone) {
        modelsBots.sendMessageAsBot(
          accountField.phone,
          `New payment from ${paymentEmail}, transaction: ${body.event_body.transaction_id}`
        );
      }

      response = await repoOrders.saveOrder({
        transaction_id: body.event_body.transaction_id,
        amount: body.event_body.action.amount,
        company_id: accountField.company_id,
        status: body.event_body.action.response_text,
        reason: body.event_type,
        extra3: JSON.stringify(body),
      });

      const instanceResponse = await modelAWS.createMachine("medium_3_0");
      const { publicIp } = instanceResponse;
      const [networkField] = await socialNetworksRepository.getByField({
        "social_networks.key": "WHATSAPP",
      });
      const [instanceField] = await repoAWS.getInstanceByField({
        "aws_instances.ip": publicIp,
      });

      modelsBots.createBOT(
        {
          companyID: accountField.company_id,
          networkID: networkField.uuid_unique,
        },
        { plan: "basic", instanceID: instanceField.uuid_unique, bot_type: 0 }
      );
    } else if (bodyType === "Woo-Body-Type" && !orderField) {
      const bodySchema = Joi.object({
        transaction_id: Joi.string().required(),
        line_items: Joi.array()
          .items(
            Joi.object({
              sku: Joi.string().required(),
              total: Joi.string().required(),
            }).unknown()
          )
          .min(1)
          .required(),
        total: Joi.string().required(),
        billing: Joi.object({
          email: Joi.string().required(),
        }).unknown(),
        status: Joi.string().required(),
      })
        .custom((obj, helpers) => {
          if (obj.total !== obj.line_items[0].total) {
            return helpers.error("string.verificationTotal", {
              message: "totals not match",
            });
          }
          return obj;
        })
        .unknown(true)
        .messages({
          "string.verificationTotal": "{{#message}}",
        });
      const { error: bodyError } = bodySchema.validate(body);

      if (bodyError) {
        throw new Error(bodyError.details[0].message);
      }

      const [accountField] = await repoAccount.getAccountByField({
        "accounts.email": body.billing.email,
      });
      if (!accountField) {
        throw new Error(`Account not found`);
      }
      const data =
        body.status === "checkout-draft"
          ? { extra1: JSON.stringify(body) }
          : { extra2: JSON.stringify(body) };
      response = await repoOrders.saveOrder({
        transaction_id: body.transaction_id,
        item: body.line_items[0].sku,
        amount: body.total,
        company_id: accountField.company_id,
        status: body.status,
        reason: "",
        ...data,
      });
    }

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

module.exports = {
  saveOrders,
};
