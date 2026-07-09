const { OpenAI } = require("openai");
const repoCompany = require("../repositories/company");

const formatLabel = (id) => {
  return id
    .replace(/^chatgpt/, "ChatGPT")
    .replace(/^gpt/, "GPT")
    .replace(/-/g, " ")
    .replace(/\b(\d)(\.\d)?\b/g, (m) => m)
    .replace(/\bmini\b/i, "Mini")
    .replace(/\bnano\b/i, "Nano")
    .replace(/\blatest\b/i, "Latest")
    .replace(/\bpreview\b/i, "Preview")
    .replace(/\binstruct\b/i, "Instruct")
    .replace(/\bturbo\b/i, "Turbo")
    .replace(/\bchat\b/i, "Chat")
    .replace(/\b\d{4}\b/g, (m) => m)
    .replace(/\s+/g, " ")
    .trim();
};

const fetchChatGptModelOptions = async (companyID) => {
  try {
    let [companyOpenAI] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "OPENAI_KEY",
    });

    if (!companyOpenAI || companyOpenAI?.data == "") {
      throw new Error(`OpenAI or OpenRouter Key not configured.`);
    }

    const openai = new OpenAI({
      apiKey: companyOpenAI?.data,
    });

    const response = await openai.models.list();

    const chatModels = response.data
      .map((m) => m.id)
      .filter((id) => id.startsWith("gpt") || id.startsWith("chatgpt"))
      .filter(
        (id) =>
          !id.includes("audio") &&
          !id.includes("image") &&
          !id.includes("tts") &&
          !id.includes("transcribe") &&
          !id.includes("search") &&
          !id.includes("realtime") &&
          !id.includes("instruc")
      )
      .filter((id) => !/-\d{4}-\d{2}-\d{2}$/.test(id))
      .sort();

    return chatModels.map((id) => ({
      value: id,
      label: formatLabel(id),
    }));
  } catch (error) {
    throw new Error(`Failed to fetch OpenAI models: ${error.message}`);
  }
};

module.exports = {
  fetchChatGptModelOptions,
};
