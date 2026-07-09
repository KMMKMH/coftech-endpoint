const SOURCE_CONFIGS = {
  BOT: [
    {
      key: "BASE_ID",
      data_type: "string",
      description: "Base ID",
      data: "",
    },
    {
      key: "TABLE_ID",
      data_type: "string",
      description: "Table ID",
      data: "",
    },
    {
      key: "TABLE_PHONE_COLUMN",
      data_type: "string",
      description: "Column Name of table stores phone numbers",
      data: "",
    },
    {
      key: "TABLE_PHONE_COUNTRY_CODE",
      data_type: "string",
      description: "Country Code or column name of table stores country code",
      data: "507",
    },
  ],
};

const SOURCES = Object.keys(SOURCE_CONFIGS);

module.exports = {
  SOURCES,
  SOURCE_CONFIGS,
};
