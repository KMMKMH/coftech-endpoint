module.exports = [
  {
    key: "INVOICE_WORDS",
    data: "INVOICE,(2024|2025)",
    description: "Words to identify an invoice separated by pipe",
  },
  {
    key: "INVOICE_AMOUNT",
    data: 50,
    description: "Amount that determines the value of 1 point",
  },
  {
    key: "INVOICE_EXTRA_FIELDS",
    data: "STORE,INVOICE NUMBER,PURCHASE DATE",
    description: "Extra fields for the invoice",
  },
  {
    key: "INVOICE_PERSONAL_DATA",
    data: `{
  "FIRST_NAME": "",
  "LAST_NAME": "",
  "ADDRESS": "",
  "PHONE": "",
  "EMAIL": ""
}`,
  description: "Personal data for the invoice",
  },
  {
    key: "BOT_MAKER_ACCESS_TOKEN",
    data: "",
    description: "Access token for Bot Maker",
  }
];
