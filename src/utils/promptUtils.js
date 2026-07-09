const { repoSystemPrompts } = require("../repositories/systemPrompts");

async function getAssistanceSystemPrompt() {
  const [systemPromptField] = await repoSystemPrompts.getByField({
    "system_prompts.key": "SYSTEM_ASSISTANCE_PROMPT",
  });

  const { uuid_unique, prompt_data: systemPrompt } = systemPromptField;

  const templatesField = await repoSystemPrompts.getByField({
    "system_prompts.parent_id": uuid_unique,
  });

  const templatesSection = templatesField
    .map((template) => `**${template.name}**\n\n${template.prompt_data}`)
    .join("\n\n---\n\n");

  const completePrompt = `${systemPrompt}\n\n${templatesSection}`;

  console.log("completePrompt", completePrompt);

  return completePrompt;
}

module.exports = {
  getAssistanceSystemPrompt,
};
