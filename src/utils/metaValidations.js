const Joi = require("joi");

const metadataSchema = Joi.object({
  display_phone_number: Joi.string().required(),
  phone_number_id: Joi.string().required(),
});

const contactSchema = Joi.object({
  profile: Joi.object({
    name: Joi.string().required(),
  }).required(),
  wa_id: Joi.string().required(),
});

const textMessageSchema = Joi.object({
  body: Joi.string().required(),
});

const mediaMessageSchema = Joi.object({
  mime_type: Joi.string().required(),
  sha256: Joi.string().required(),
  id: Joi.string().required(),
  caption: Joi.string().optional(),
  filename: Joi.string().optional(),
  voice: Joi.boolean().optional(),
  animated: Joi.boolean().optional(),
});

const locationMessageSchema = Joi.object({
  longitude: Joi.number().required(),
  latitude: Joi.number().required(),
  name: Joi.string().optional(),
  address: Joi.string().optional(),
});

const contactsMessageSchema = Joi.array().items(
  Joi.object({
    addresses: Joi.array().optional(),
    birthday: Joi.string().optional(),
    emails: Joi.array().optional(),
    name: Joi.object().required(),
    org: Joi.object().optional(),
    phones: Joi.array().optional(),
    urls: Joi.array().optional(),
  })
);

const buttonReplySchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().required(),
});

const listReplySchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
});

const interactiveMessageSchema = Joi.object({
  type: Joi.string().valid("button_reply", "list_reply").required(),
}).when(".type", {
  is: "button_reply",
  then: Joi.object({
    button_reply: buttonReplySchema.required(),
  }),
  otherwise: Joi.when(".type", {
    is: "list_reply",
    then: Joi.object({
      list_reply: listReplySchema.required(),
    }),
  }),
});

const inboundMessageSchema = Joi.object({
  from: Joi.string().required(),
  id: Joi.string().required(),
  timestamp: Joi.string().required(),
  type: Joi.string()
    .valid(
      "text",
      "image",
      "document",
      "audio",
      "video",
      "sticker",
      "location",
      "contacts",
      "interactive",
      "button",
      "list_reply",
      "unsupported"
    )
    .required(),
  context: Joi.object({
    from: Joi.string(),
    id: Joi.string(),
    mentions: Joi.array().items(Joi.string()).optional(),
    quoted: Joi.boolean().optional(),
    forwarded: Joi.boolean().optional(),
    frequently_forwarded: Joi.boolean().optional(),
  }).optional(),
}).when(".type", [
  { is: "text", then: Joi.object({ text: textMessageSchema.required() }) },
  { is: "image", then: Joi.object({ image: mediaMessageSchema.required() }) },
  {
    is: "document",
    then: Joi.object({ document: mediaMessageSchema.required() }),
  },
  { is: "audio", then: Joi.object({ audio: mediaMessageSchema.required() }) },
  { is: "video", then: Joi.object({ video: mediaMessageSchema.required() }) },
  {
    is: "sticker",
    then: Joi.object({ sticker: mediaMessageSchema.required() }),
  },
  {
    is: "location",
    then: Joi.object({ location: locationMessageSchema.required() }),
  },
  {
    is: "contacts",
    then: Joi.object({ contacts: contactsMessageSchema.required() }),
  },
  {
    is: "interactive",
    then: Joi.object({ interactive: interactiveMessageSchema.required() }),
  },
]);

const statusUpdateSchema = Joi.object({
  id: Joi.string().required(),
  status: Joi.string().valid("sent", "delivered", "read", "failed").required(),
  timestamp: Joi.string().required(),
  recipient_id: Joi.string().required(),
  conversation: Joi.object({
    id: Joi.string().required(),
    expiration_timestamp: Joi.string().optional(),
    origin: Joi.object({
      type: Joi.string()
        .valid(
          "business_initiated",
          "customer_initiated",
          "referral_conversion",
          "utility"
        )
        .required(),
    }).required(),
  }).optional(),
  pricing: Joi.object({
    billable: Joi.boolean().required(),
    pricing_model: Joi.string().valid("CBP", "PMP").required(),
    type: Joi.string().optional(),
    category: Joi.string()
      .valid("utility", "authentication", "marketing", "service")
      .required(),
  }).optional(),
  errors: Joi.array()
    .items(
      Joi.object({
        code: Joi.number().required(),
        title: Joi.string().required(),
        message: Joi.string().optional(),
        href: Joi.string().optional(),
        error_data: Joi.object({
          details: Joi.string().optional(),
        }).optional(),
      })
    )
    .optional(),
});

const webhookValueSchema = Joi.object({
  messaging_product: Joi.string().valid("whatsapp").required(),
  metadata: metadataSchema.required(),
  contacts: Joi.array().items(contactSchema).optional(),
  messages: Joi.array().items(inboundMessageSchema),
  statuses: Joi.array().items(statusUpdateSchema),
})
  .xor("messages", "statuses")
  .when(Joi.object({ messages: Joi.exist() }).unknown(), {
    then: Joi.object({
      messages: Joi.required(),
    }),
  })
  .when(Joi.object({ statuses: Joi.exist() }).unknown(), {
    then: Joi.object({
      statuses: Joi.required(),
    }),
  });

const whatsappWebhookSchema = Joi.object({
  object: Joi.string().valid("whatsapp_business_account").required(),
  entry: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        changes: Joi.array()
          .items(
            Joi.object({
              value: webhookValueSchema.required(),
              field: Joi.string().valid("messages").required(),
            })
          )
          .required(),
      })
    )
    .required(),
});

function validateWhatsAppWebhook(payload) {
  const { error, value } = whatsappWebhookSchema.validate(payload, {
    allowUnknown: false,
    abortEarly: false,
  });

  if (error) {
    return {
      isValid: false,
      error: error.details,
      type: null,
      data: null,
    };
  }

  const change = value.entry[0].changes[0];
  const webhookValue = change.value;

  let type, data;
  if (webhookValue.messages) {
    type = "inbound_message";
    data = {
      messages: webhookValue.messages,
      contacts: webhookValue.contacts || [],
      metadata: webhookValue.metadata,
    };
  } else if (webhookValue.statuses) {
    type = "status_update";
    data = {
      statuses: webhookValue.statuses,
      metadata: webhookValue.metadata,
    };
  }

  return {
    isValid: true,
    error: null,
    type,
    data,
    rawPayload: value,
  };
}

function isFromBot(payload, botPhoneNumberId) {
  const validation = validateWhatsAppWebhook(payload);
  if (!validation.isValid) return null;

  return {
    isFromBot: validation.type === "status_update",
    type: validation.type,
    phoneNumberId: validation.data.metadata.phone_number_id,
    isYourBot: validation.data.metadata.phone_number_id === botPhoneNumberId,
  };
}

module.exports = {
  whatsappWebhookSchema,
  validateWhatsAppWebhook,
  isFromBot,
  mediaMessageSchema,
};
