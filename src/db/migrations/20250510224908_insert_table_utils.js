/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const tableName = "utils";

  const actionTypes = [
    { key: "update", names: { en: "Update", es: "Actualizar", zh: "更新" } },
    { key: "delete", names: { en: "Delete", es: "Eliminar", zh: "删除" } },
    { key: "create", names: { en: "Create", es: "Crear", zh: "创建" } },
    {
      key: "initialize",
      names: { en: "Initialize", es: "Inicializar", zh: "初始化" },
    },
    { key: "stop", names: { en: "Stop", es: "Detener", zh: "停止" } },
    { key: "restart", names: { en: "Restart", es: "Reiniciar", zh: "重启" } },
    { key: "start", names: { en: "Start", es: "Iniciar", zh: "启动" } },
    { key: "save", names: { en: "Save", es: "Guardar", zh: "保存" } },
    {
      key: "disable",
      names: { en: "Disable", es: "Deshabilitar", zh: "禁用" },
    },
    { key: "enabled", names: { en: "Enabled", es: "Habilitado", zh: "启用" } },
    { key: "upload", names: { en: "Upload", es: "Subir", zh: "上传" } },
  ];

  const resourceTypes = [
    { key: "account", names: { en: "Account", es: "Cuenta", zh: "账户" } },
    { key: "bot", names: { en: "Bot", es: "Bot", zh: "机器人" } },
    {
      key: "bot_config",
      names: {
        en: "Bot Config",
        es: "Bot Configuration",
        zh: "机器人配置",
      },
    },
    {
      key: "bot_extension",
      names: { en: "Bot Extension", es: "Bot Extension", zh: "机器人扩展" },
    },
    { key: "company", names: { en: "Company", es: "Company", zh: "公司" } },
    {
      key: "company_config",
      names: {
        en: "Company Config",
        es: "Company Configuration",
        zh: "公司配置",
      },
    },
    { key: "file", names: { en: "File", es: "Archivo", zh: "文件" } },
    { key: "prompt", names: { en: "Prompt", es: "Prompt", zh: "提示词" } },
  ];

  await knex(tableName).insert([
    {
      key: "ACTION_TYPE",
      data: JSON.stringify(actionTypes),
    },
    {
      key: "RESOURCE_TYPE",
      data: JSON.stringify(resourceTypes),
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex("utils").whereIn("key", ["ACTION_TYPE", "RESOURCE_TYPE"]).del();
};
