const filterExtension = (response) => {
  try {
    return response.map((row) => {
      const configNames = row.config_names;
      const configKeys = row.config_keys;
      const configDatas = row.config_datas;
      const configDataTypes = row.config_data_types;
      const configDataOptions = row.config_data_options;
      const configDescriptions = row.config_descriptions;
      const configTrigger = row.config_data_trigger;
      const configExtra = row.config_data_extra;

      const configs = configKeys.map((key, index) => ({
        name: configNames[index] === "null" ? null : configNames[index],
        key: key === "null" ? null : key,
        data: configDatas[index] === "null" ? null : configDatas[index],
        type: configDataTypes[index] === "null" ? null : configDataTypes[index],
        description:
          configDescriptions[index] === "null"
            ? null
            : configDescriptions[index],
        options:
          configDataOptions[index] === "null"
            ? null
            : JSON.parse(configDataOptions[index]),
        trigger: configTrigger ? configTrigger[index] : null,
        extra: configExtra ? configExtra[index] : null,
      }));
      delete row.config_keys;
      delete row.config_datas;
      delete row.config_data_types;
      delete row.config_data_options;
      delete row.config_descriptions;
      delete row.config_data_trigger;
      delete row.config_data_extra;
      delete row.config_names;

      return {
        ...row,
        configs: configs,
      };
    });
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = { filterExtension };
