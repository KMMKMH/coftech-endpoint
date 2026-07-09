const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const values = [
    {
      key: "HUMANIZE_RESPONSE",
      description: {
        en: "Bot simulates typing times like a human.",
        es: "Bot simulates typing times like a human.",
        zh: "机器人模拟像人类一样的打字时间。",
      },
    },
    {
      key: "SPEECH_TO_TEXT",
      description: {
        en: "Bot can convert voice messages into text.",
        es: "Bot can convert voice messages into text.",
        zh: "机器人可以将语音信息转换为文本。",
      },
    },
    {
      key: "XETUX",
      description: {
        en: "Can handle invoices with Xetux.",
        es: "Can handle invoices with Xetux.",
        zh: "可以处理 Xetux 的发票。",
      },
    },
    {
      key: "GPT_SPEECH_TO_SPEECH",
      description: {
        en: "Bot can answer voice messages with voice using GPT.",
        es: "Bot can answer voice messages with voice using GPT.",
        zh: "机器人可以使用 GPT 通过语音回复语音信息。",
      },
    },
    {
      key: "NOCODB_SERVICE",
      description: {
        en: "Bot can handle database queries with NocoDB.",
        es: "Bot can handle database queries with NocoDB.",
        zh: "机器人可以使用 NocoDB 处理数据库查询。",
      },
    },
    {
      key: "GLORIA_FOOD",
      description: {
        en: "Bot can search the restaurant menu with Gloria Food.",
        es: "Bot can search the restaurant menu with Gloria Food.",
        zh: "机器人可以使用 Gloria Food 搜索餐馆菜单。",
      },
    },
    {
      key: "ELEVENLABS",
      description: {
        en: "Bot can answer voice messages with voice using ElevenLabs.",
        es: "Bot can answer voice messages with voice using ElevenLabs.",
        zh: "机器人可以使用 ElevenLabs 通过语音回复语音信息。",
      },
    },
    {
      key: "SCREENSHOT",
      description: {
        en: "Allows the bot to take screenshots.",
        es: "Allows the bot to take screenshots.",
        zh: "允许机器人进行截图。",
      },
    },
    {
      key: "NMI",
      description: {
        en: "Allows to use NMI payment service",
        es: "Allows to use NMI payment service",
        zh: "允许使用 NMI 支付服务",
      },
    },
    {
      key: "YAPPY",
      description: {
        en: "Allows to use Yappy payment service",
        es: "Allows to use Yappy payment service",
        zh: "允许使用 Yappy 支付服务",
      },
    },
    {
      key: "GOOGLE_CALENDAR",
      description: {
        en: "Allows the bot to manage calendar events and appointments.",
        es: "Allows the bot to manage calendar events and appointments.",
        zh: "允许机器人管理日历事件和约会。",
      },
    },
    {
      key: "PROMPT_PAYMENTS",
      description: {
        en: "Bot can generate a payment link for the customer.",
        es: "Bot can generate a payment link for the customer.",
        zh: "机器人可以为客户生成付款链接。",
      },
    },
    {
      key: "BAGUTA_DATA",
      description: {
        en: "Bot can connect to a external database and get information about it.",
        es: "Bot can connect to a external database and get information about it.",
        zh: "机器人可以连接到外部数据库并获取信息。",
      },
    },
    {
      key: "CAMPAIGNS",
      description: {
        en: "Allows the robot to notify contacts in bulk about an event.",
        es: "Allows the robot to notify contacts in bulk about an event.",
        zh: "允许机器人向联系人批量通知事件。",
      },
    },
    {
      key: "WHATSAPP_SETTINGS",
      description: {
        en: "Allows control over WhatsApp call reception status and auto-response messages for calls.",
        es: "Allows control over WhatsApp call reception status and auto-response messages for calls.",
        zh: "允许控制 WhatsApp 通话接收状态和设置自动响应消息。",
      },
    },
    {
      key: "CUSTOMER_SUPPORT_WP",
      description: {
        en: "Supports customer service via WhatsApp groups",
        es: "Supports customer service via WhatsApp groups",
        zh: "支持通过 WhatsApp 群组进行客户服务",
      },
    },
    {
      key: "CALL_CENTER",
      description: {
        en: "This extension allows for the management of customer service through messages. It provides tools for handling customer interactions, tracking communication metrics, and improving customer service efficiency.",
        es: "This extension allows for the management of customer service through messages. It provides tools for handling customer interactions, tracking communication metrics, and improving customer service efficiency.",
        zh: "此扩展允许通过消息管理客户服务。它提供处理客户交互、跟踪通信指标和提高客户服务效率的工具。",
      },
    },
    {
      key: "OPEN_AI_SERVICE",
      description: {
        en: "Allows the bot to generate text using OpenAI.",
        es: "Allows the bot to generate text using OpenAI.",
        zh: "允许机器人使用 OpenAI 生成文本。",
      },
    },
    {
      key: "GEMINI",
      description: {
        en: "Uses Google Gemini for generating text embeddings in RAG (Retrieval-Augmented Generation).",
        es: "Uses Google Gemini for generating text embeddings in RAG (Retrieval-Augmented Generation).",
        zh: "使用 Google Gemini 生成 RAG（检索增强生成）中的文本嵌入。",
      },
    },
    {
      key: "PINECONE",
      description: {
        en: "Pinecone is a vector database that enables you to search and retrieve similar items in high-dimensional vector spaces.",
        es: "Pinecone is a vector database that enables you to search and retrieve similar items in high-dimensional vector spaces.",
        zh: "Pinecone 是一个向量数据库，可让您在高维向量空间中搜索和检索相似项目。",
      },
    },
    {
      key: "BRAIN",
      description: {
        en: "The artificial intelligence of your bot",
        es: "The artificial intelligence of your bot",
        zh: "您的机器人的人工智能",
      },
    },
  ];

  for (const extension of values) {
    await knex(tableName).where({ key: extension.key }).update({ description: JSON.stringify(extension.description) });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const values = [
    {
      key: "HUMANIZE_RESPONSE",
      description: {
        english: "Bot simulates typing times like a human.",
        spanish: "Bot simulates typing times like a human.",
      },
    },
    {
      key: "SPEECH_TO_TEXT",
      description: {
        english: "Bot can convert voice messages into text.",
        spanish: "Bot can convert voice messages into text.",
      },
    },
    {
      key: "XETUX",
      description: {
        english: "Can handle invoices with Xetux.",
        spanish: "Can handle invoices with Xetux.",
      },
    },
    {
      key: "GPT_SPEECH_TO_SPEECH",
      description: {
        english: "Bot can answer voice messages with voice using GPT.",
        spanish: "Bot can answer voice messages with voice using GPT.",
      },
    },
    {
      key: "NOCODB_SERVICE",
      description: {
        english: "Bot can handle database queries with NocoDB.",
        spanish: "Bot can handle database queries with NocoDB.",
      },
    },
    {
      key: "GLORIA_FOOD",
      description: {
        english: "Bot can search the restaurant menu with Gloria Food.",
        spanish: "Bot can search the restaurant menu with Gloria Food.",
      },
    },
    {
      key: "ELEVENLABS",
      description: {
        english: "Bot can answer voice messages with voice using ElevenLabs.",
        spanish: "Bot can answer voice messages with voice using ElevenLabs.",
      },
    },
    {
      key: "SCREENSHOT",
      description: {
        english: "Allows the bot to take screenshots.",
        spanish: "Allows the bot to take screenshots.",
      },
    },
    {
      key: "NMI",
      description: {
        english: "Allows to use NMI payment service",
        spanish: "Allows to use NMI payment service",
      },
    },
    {
      key: "YAPPY",
      description: {
        english: "Allows to use Yappy payment service",
        spanish: "Allows to use Yappy payment service",
      },
    },
    {
      key: "GOOGLE_CALENDAR",
      description: {
        english: "Allows the bot to manage calendar events and appointments.",
        spanish: "Allows the bot to manage calendar events and appointments.",
      },
    },
    {
      key: "PROMPT_PAYMENTS",
      description: {
        english: "Bot can generate a payment link for the customer.",
        spanish: "Bot can generate a payment link for the customer.",
      },
    },
    {
      key: "BAGUTA_DATA",
      description: {
        english:
          "Bot can connect to a external database and get information about it.",
        spanish: "Bot can connect to a external database and get information about it.",
      },
    },
    {
      key: "CAMPAIGNS",
      description: {
        english: "Allows the robot to notify contacts in bulk about an event.",
        spanish: "Allows the robot to notify contacts in bulk about an event.",
      },
    },
    {
      key: "WHATSAPP_SETTINGS",
      description: {
        english:
          "Allows control over WhatsApp call reception status and auto-response messages for calls.",
        spanish: "Allows control over WhatsApp call reception status and auto-response messages for calls.",
      },
    },
    {
      key: "CUSTOMER_SUPPORT_WP",
      description: {
        english: "Supports customer service via WhatsApp groups",
        spanish: "Supports customer service via WhatsApp groups",
      },
    },
    {
      key: "CALL_CENTER",
      description: {
        en: "This extension allows for the management of customer service through messages. It provides tools for handling customer interactions, tracking communication metrics, and improving customer service efficiency.",
        es: "This extension allows for the management of customer service through messages. It provides tools for handling customer interactions, tracking communication metrics, and improving customer service efficiency.",
      },
    },
    {
      key: "OPEN_AI_SERVICE",
      description: {
        english: "Allows the bot to generate text using OpenAI.",
        spanish: "Allows the bot to generate text using OpenAI.",
      },
    },
    {
      key: "GEMINI",
      description: {
        english:
          "Uses Google Gemini for generating text embeddings in RAG (Retrieval-Augmented Generation).",
        spanish: "Uses Google Gemini for generating text embeddings in RAG (Retrieval-Augmented Generation).",
      },
    },
    {
      key: "PINECONE",
      description: {
        en: "Pinecone is a vector database that enables you to search and retrieve similar items in high-dimensional vector spaces.",
        es: "Pinecone is a vector database that enables you to search and retrieve similar items in high-dimensional vector spaces.",
      },
    },
    {
      key: "BRAIN",
      description: {
        english: "The artificial intelligence of your bot",
        spanish: "The artificial intelligence of your bot",
      },
    },
  ];

  for (const extension of values) {
    await knex(tableName)
      .where({ key: extension.key })
      .update({ description: JSON.stringify(extension.description) });
  }
};
