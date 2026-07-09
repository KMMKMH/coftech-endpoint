function replaceVariablesInText(template, dbRegisterRow) {
  let message = template.replace(/{{(.*?)}}/g, (match, p1) => {
    return dbRegisterRow[p1] || match;
  });

  return message.replace(/\\n/g, "\n");
}

module.exports = replaceVariablesInText;