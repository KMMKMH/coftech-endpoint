const tableName = "configs_templates";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const companyGlobalConfigs = [
    {
      key: "BOT_HUMAN_TIMEOUT",
      data: 30,
      data_type: "integer",
      description: "MINUTES TO REACTIVATE BOT",
    },
    {
      key: "BOT_HUMAN_TIMEOUT_GROUPS",
      data: true,
      data_type: "boolean",
      description: "BOT CAN REACTIVATE IN GROUPS",
    },
    {
      key: "RESPOND_ONLY_WHITELIST",
      data: "false",
      data_type: "boolean",
      description: "ALLOW RESPONSES ONLY TO WHITELISTED USERS",
    },
    {
      key: "NON_WHITELIST_MESSAGE",
      data: "You are not authorized to receive a response.",
      data_type: "string",
      description: "MESSAGE SHOWN TO NON-WHITELISTED USERS",
    },
    {
      key: "BOT_MAKER_ACCESS_TOKEN",
      data: "",
      data_type: "string",
      description: "Access token for Bot Maker",
    },
    {
      key: "TIMEZONE",
      data: "America/Bogota",
      data_type: "string",
      description: "Timezone for the company",
    }
  ];

  for (const config of companyGlobalConfigs) {
    await knex(tableName).insert({
      owner_type: "company",
      key: config.key,
      data_default: config.data,
      description: config.description,
      data_type: config.data_type,
    });
  }

  const companyExtensionConfigs = {
    BAGUTA_DATA: [
      {
        key: "BAGUTA_DB_STATUS",
        data: "false",
        description: "DB Status",
        data_type: "boolean",
      },
      {
        key: "BAGUTA_DB_HOSTNAME",
        data: "",
        description: "DB Hostname",
        data_type: "string",
      },
      {
        key: "BAGUTA_DB_PORT",
        data: "",
        description: "DB Port",
        data_type: "string",
      },
      {
        key: "BAGUTA_DB_USERNAME",
        data: "",
        description: "DB Username",
        data_type: "string",
      },
      {
        key: "BAGUTA_DB_PASSWORD",
        data: "",
        description: "DB Password",
        data_type: "string",
      },
      {
        key: "BAGUTA_DB_DATABASE",
        data: "",
        description: "DB Name",
        data_type: "string",
      },
      {
        key: "BAGUTA_DB_DRIVER",
        data: "mysql",
        description: "DB Driver",
        data_type: "enum",
        data_options: JSON.stringify([
          { label: "MySQL", value: "mysql" },
          { label: "MySQL2", value: "mysql2" },
          { label: "Postgres", value: "postgres" },
          { label: "SQLite", value: "sqlite" },
          { label: "Better SQLite", value: "better-sqlite3" },
          { label: "OracleDB", value: "oracledb" },
          { label: "MSSQL", value: "tedious" },
        ]),
      },
      {
        key: "BAGUTA_DB_VIEW1",
        data: "AIBOT_CUSTOMERS_VW",
        description: "DB View name",
        data_type: "string",
      },
    ],
    CAMPAIGNS: [
      {
        key: "CAMPAIGNS_STATUS",
        data: "false",
        description: "Campaigns Status",
        data_type: "boolean",
      },
      {
        key: "CAMPAIGNS_MESSAGE_DELAY",
        data: "3",
        description: "Campaigns Message Delay",
        data_type: "float",
        data_options: JSON.stringify({
          min: 3,
          max: 60,
        }),
      },
    ],
    CUSTOMER_SUPPORT_WP: [
      {
        key: "CUSTOMER_SUPPORT_WP_STATUS",
        data: "false",
        description: "Customer Support WP Status",
        data_type: "boolean",
      },
      {
        key: "CUSTOMER_SUPPORT_WP_KEYWORDS",
        data: "",
        description: "Customer Support WP Keywords to activate",
        data_type: "string",
      },
      {
        key: "CUSTOMER_SUPPORT_WP_GROUP_NAME",
        data: "",
        description:
          "Customer Support group name to notificate sessions expired",
        data_type: "string",
      },
    ],
    ELEVENLABS: [
      {
        key: "ELEVENLABS_STATUS",
        data: "false",
        description: "ElevenLabs Status",
        data_type: "boolean",
      },
      {
        key: "ELEVENLABS_KEY",
        data: "",
        description: "ElevenLabs API Key",
        data_type: "string",
      },
      {
        key: "ELEVENLABS_MODEL",
        data: "eleven_multilingual_v2",
        description: "ElevenLabs model label",
        data_type: "enum",
        data_options: JSON.stringify([
          {
            label: "Eleven Multilingual v2",
            value: "eleven_multilingual_v2",
          },
          {
            label: "Eleven Turbo v2.5",
            value: "eleven_turbo_v2_5",
          },
          {
            label: "Eleven Turbo v2",
            value: "eleven_turbo_v2",
          },
          {
            label: "Eleven English v1",
            value: "eleven_monolingual_v1",
          },
          {
            label: "Eleven English v2",
            value: "eleven_english_sts_v2",
          },
          {
            label: "Eleven Multilingual v2",
            value: "eleven_multilingual_sts_v2",
          },
          {
            label: "Eleven Multilingual v1",
            value: "eleven_multilingual_v1",
          },
        ]),
      },
      {
        key: "ELEVENLABS_LANGUAGE",
        data: "es",
        description: "ElevenLabs voice language",
        data_type: "enum",
        data_options: JSON.stringify([
          { value: "en", label: "English" },
          { value: "de", label: "German" },
          { value: "pl", label: "Polish" },
          { value: "es", label: "Spanish" },
          { value: "it", label: "Italian" },
          { value: "fr", label: "French" },
          { value: "pt", label: "Portuguese" },
          { value: "hi", label: "Hindi" },
          { value: "ar", label: "Arabic" },
          { value: "ja", label: "Japanese" },
          { value: "ko", label: "Korean" },
          { value: "zh", label: "Chinese" },
        ]),
      },
      {
        key: "ELEVENLABS_VOICES",
        data: "EXAVITQu4vr4xnSDxMaL",
        description: "ElevenLabs Voice options",
        data_type: "enum",
        data_options: JSON.stringify([
          {
            label: "Sarah",
            value: "EXAVITQu4vr4xnSDxMaL",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/01a3e33c-6e99-4ee7-8543-ff2216a32186.mp3",
          },
          {
            label: "Laura",
            value: "FGY2WhTYpPnrIDTdsKH5",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/FGY2WhTYpPnrIDTdsKH5/67341759-ad08-41a5-be6e-de12fe448618.mp3",
          },
          {
            label: "Charlie",
            value: "IKne3meq5aSn9XLyUdCD",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/IKne3meq5aSn9XLyUdCD/102de6f2-22ed-43e0-a1f1-111fa75c5481.mp3",
          },
          {
            label: "George",
            value: "JBFqnCBsd6RMkjVDRZzb",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/JBFqnCBsd6RMkjVDRZzb/e6206d1a-0721-4787-aafb-06a6e705cac5.mp3",
          },
          {
            label: "Callum",
            value: "N2lVS1w4EtoT3dr4eOWO",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/N2lVS1w4EtoT3dr4eOWO/ac833bd8-ffda-4938-9ebc-b0f99ca25481.mp3",
          },
          {
            label: "Liam",
            value: "TX3LPaxmHKxFdv7VOQHJ",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/TX3LPaxmHKxFdv7VOQHJ/63148076-6363-42db-aea8-31424308b92c.mp3",
          },
          {
            label: "Charlotte",
            value: "XB0fDUnXU5powFXDhCwa",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/942356dc-f10d-4d89-bda5-4f8505ee038b.mp3",
          },
          {
            label: "Alice",
            value: "Xb7hH8MSUJpSbSDYk0k2",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/Xb7hH8MSUJpSbSDYk0k2/d10f7534-11f6-41fe-a012-2de1e482d336.mp3",
          },
          {
            label: "Matilda",
            value: "XrExE9yKIg1WjnnlVkGX",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/b930e18d-6b4d-466e-bab2-0ae97c6d8535.mp3",
          },
          {
            label: "Will",
            value: "bIHbv24MWmeRgasZH58o",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/bIHbv24MWmeRgasZH58o/8caf8f3d-ad29-4980-af41-53f20c72d7a4.mp3",
          },
          {
            label: "Jessica",
            value: "cgSgspJ2msm6clMCkdW9",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3",
          },
          {
            label: "Eric",
            value: "cjVigY5qzO86Huf0OWal",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/d098fda0-6456-4030-b3d8-63aa048c9070.mp3",
          },
          {
            label: "Chris",
            value: "iP95p4xoKVk53GoZ742B",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/iP95p4xoKVk53GoZ742B/3f4bde72-cc48-40dd-829f-57fbf906f4d7.mp3",
          },
          {
            label: "Brian",
            value: "nPczCjzI2devNBz1zQrb",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/nPczCjzI2devNBz1zQrb/2dd3e72c-4fd3-42f1-93ea-abc5d4e5aa1d.mp3",
          },
          {
            label: "Daniel",
            value: "onwK4e9ZLuTAKqWW03F9",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/7eee0236-1a72-4b86-b303-5dcadc007ba9.mp3",
          },
          {
            label: "Lily",
            value: "pFZP5JQG7iQjIQuC4Bku",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/pFZP5JQG7iQjIQuC4Bku/89b68b35-b3dd-4348-a84a-a3c13a3c2b30.mp3",
          },
          {
            label: "Bill",
            value: "pqHfZKP75CvOlQylNhV4",
            example:
              "https://storage.googleapis.com/eleven-public-prod/premade/voices/pqHfZKP75CvOlQylNhV4/d782b3ff-84ba-4029-848c-acf01285524d.mp3",
          },
        ]),
      },
    ],
    GLORIA_FOOD: [
      {
        key: "GLORIA_FOOD_STATUS",
        data: "true",
        description: "Gloria Food extension status",
        data_type: "boolean",
      },
      {
        key: "GLORIA_FOOD_AUTH_TOKEN",
        data: "",
        description: "Gloria Food authorization token",
        data_type: "string",
      },
    ],
    GOOGLE_CALENDAR: [
      {
        key: "GOOGLE_CALENDAR_STATUS",
        data: "false",
        description: "Google Calendar Status",
        data_type: "boolean",
      },
      {
        key: "GOOGLE_CALENDAR_CLIENT_ID",
        data: "",
        description: "Google Calendar Client ID",
        data_type: "string",
      },
      {
        key: "GOOGLE_CALENDAR_CLIENT_SECRET",
        data: "",
        description: "Google Calendar Client Secret",
        data_type: "string",
      },
      {
        key: "GOOGLE_CALENDAR_REPEAT_APPOINTMENT",
        data: "false",
        description: "Google Calendar Repeat Appointment",
        data_type: "boolean",
      },
      {
        key: "GOOGLE_CALENDAR_REMINDER_INTERVAL",
        data: "24:00",
        description: "Google Calendar Reminder Interval",
        data_type: "time",
      },
      {
        key: "GOOGLE_CALENDAR_INTERNAL_CRON",
        data: "*/2 * * * *",
        description: "Google Calendar Internal Cron",
        data_type: "cron",
        internal: true,
      },
    ],
    GPT_SPEECH_TO_SPEECH: [
      {
        key: "GPT_SPEECH_TO_SPEECH_STATUS",
        data: "false",
        description: "Speech to Speech Status",
        data_type: "boolean",
      },
      {
        key: "GPT_SPEECH_VOICE",
        data: "alloy",
        description: "Specific GPT Voice Model",
        data_type: "enum",
        data_options: JSON.stringify([
          {
            label: "Echo",
            value: "echo",
            example:
              "https://platform.openai.com/docs/guides/text-to-speech/echo",
          },
          {
            label: "Alloy",
            value: "alloy",
            example:
              "https://platform.openai.com/docs/guides/text-to-speech/alloy",
          },
          {
            label: "Fable",
            value: "fable",
            example:
              "https://platform.openai.com/docs/guides/text-to-speech/fable",
          },
          {
            label: "Onyx",
            value: "onyx",
            example:
              "https://platform.openai.com/docs/guides/text-to-speech/onyx",
          },
          {
            label: "Nova",
            value: "nova",
            example:
              "https://platform.openai.com/docs/guides/text-to-speech/nova",
          },
          {
            label: "Shimmer",
            value: "shimmer",
            example:
              "https://platform.openai.com/docs/guides/text-to-speech/shimmer",
          },
        ]),
      },
    ],
    HUMANIZE_RESPONSE: [
      {
        key: "HUMANIZE_RESPONSE_STATUS",
        data: "false",
        description: "Enable or Disable Humanize Response",
        data_type: "boolean",
      },
    ],
    NMI: [
      {
        key: "NMI_STATUS",
        data: "false",
        description: "Enable or Disable NMI Payment",
        data_type: "boolean",
      },
      {
        key: "NMI_API_KEY",
        data: "",
        description: "NMI API Key",
        data_type: "string",
      },
    ],
    YAPPY: [
      {
        key: "YAPPY_STATUS",
        data: "false",
        description: "Enable or Disable Yappy Payment",
        data_type: "boolean",
      },
      {
        key: "YAPPY_API_KEY",
        data: "",
        description: "Yappy API Key",
        data_type: "string",
      },
      {
        key: "YAPPY_MERCHANT_ID",
        data: "",
        description: "Yappy Merchant ID",
        data_type: "string",
      },
    ],
    NOCODB_SERVICE: [
      {
        key: "NOCODB_STATUS",
        data: "false",
        description: "Enable or Disable NocoDB Service",
        data_type: "boolean",
      },
    ],
    OPEN_AI_SERVICE: [
      {
        key: "OPENAI_KEY",
        data: "",
        description: "OPEN AI KEY",
        data_type: "string",
      },
      {
        key: "GPT_MODEL",
        data: "gpt-4o-mini",
        description: "SPECIFIC GPT MODEL",
        data_type: "string",
      },
      {
        key: "GPT_TEMPERATURE",
        data: "1",
        description: "Set the temperature of the GPT",
        data_type: "float",
        data_options: JSON.stringify({
          min: 0,
          max: 2,
        }),
      },
    ],
    PROMPT_PAYMENTS: [
      {
        key: "PROMPT_PAYMENTS_STATUS",
        data: "false",
        description:
          "Prompt Payments Status to bot generate a payment link for the customer.",
        data_type: "boolean",
      },
      {
        key: "PROMPT_PAYMENTS_WP_GROUP",
        data: "",
        description:
          "Payment group where the bot sends a successful payment notification with the order details.",
        data_type: "string",
      },
    ],
    SCREENSHOT: [
      {
        key: "SCREENSHOT_STATUS",
        data: "false",
        description: "Screenshot Status",
        data_type: "boolean",
      },
      {
        key: "SCREENSHOT_GROUP",
        data: "",
        description: "Group Screenshot Name",
        data_type: "string",
      },
      {
        key: "SCREENSHOT_DATA",
        data: JSON.stringify({
          status: "false",
          prompt: "your prompt here",
          fields: [],
          group: "",
        }),
        description: "Screenshot Data Custom Fields",
        data_type: "json",
      },
    ],
    SPEECH_TO_TEXT: [
      {
        key: "SPEECH_TO_TEXT_STATUS",
        data: "false",
        description: "Enable or Disable Speech to Text",
        data_type: "boolean",
      },
    ],
    WHATSAPP_CALL_CONTROL: [
      {
        key: "WHATSAPP_ALLOW_CALL_STATUS",
        data: "false",
        description: "enables or disables WhatsApp call reception",
        data_type: "boolean",
      },
      {
        key: "WHATSAPP_MSG_CALL",
        data: "Calls are currently disabled.",
        description: "response call message",
        data_type: "string",
      },
    ],
    XETUX: [
      {
        key: "XETUX_STATUS",
        data: "",
        description: "Xetux status",
        data_type: "boolean",
      },
      {
        key: "XETUX_URL",
        data: "",
        description: "url del comercio",
        data_type: "string",
      },
      {
        key: "XETUX_PROJECT_ID",
        data: "",
        description: "Xetux project ID",
        data_type: "string",
      },
      {
        key: "XETUX_TABLE_SALES_FULL",
        data: "",
        description: "SALES FULL table ID",
        data_type: "string",
      },
      {
        key: "XETUX_TABLE_SALES_PAY",
        data: "",
        description: "SALES PAY table ID",
        data_type: "string",
      },
      {
        key: "XETUX_TABLE_PURCHASES_FULL",
        data: "",
        description: "PURCHASES FULL table ID",
        data_type: "string",
      },
      {
        key: "XETUX_TABLE_BALANCE_SUMMARY",
        data: "",
        description: "BALANCE SUMMARY table ID",
        data_type: "string",
      },
      {
        key: "XETUX_SUMMARY",
        data: "",
        description: "Time when the summary will run",
        data_type: "cron",
      },
    ],
  };

  for (const extension in companyExtensionConfigs) {
    const [existExtension] = await knex("extensions").where({
      "extensions.key": extension,
    });
    if (existExtension) {
      for (const config of companyExtensionConfigs[extension]) {
        await knex(tableName).insert({
          owner_type: "extension",
          key: config.key,
          data_default: config.data,
          description: config.description,
          data_type: config.data_type,
          ...(config.data_options && { data_options: config.data_options }),
          extension_id: existExtension.uuid_unique,
          ...(config.internal && { internal: config.internal }),
        });
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  for (const config of await knex(tableName).select("id")) {
    await knex(tableName).where({ id: config.id }).del();
  }
};
