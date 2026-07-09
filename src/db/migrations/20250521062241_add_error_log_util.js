/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const actionTypeRecord = await knex("utils")
    .where("key", "ACTION_TYPE")
    .first();

  if (actionTypeRecord) {
    let actionTypes;

    if (typeof actionTypeRecord.data === "string") {
      actionTypes = JSON.parse(actionTypeRecord.data);
    } else {
      actionTypes = actionTypeRecord.data;
    }

    const errorExists = actionTypes.some((action) => action.key === "error");

    if (!errorExists) {
      actionTypes.push({
        key: "error",
        names: { en: "Error", es: "Error", zh: "错误" },
      });

      await knex("utils")
        .where("key", "ACTION_TYPE")
        .update({
          data: JSON.stringify(actionTypes),
        });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const actionTypeRecord = await knex("utils")
    .where("key", "ACTION_TYPE")
    .first();

  if (actionTypeRecord) {
    let actionTypes;

    if (typeof actionTypeRecord.data === "string") {
      actionTypes = JSON.parse(actionTypeRecord.data);
    } else {
      actionTypes = actionTypeRecord.data;
    }

    const updatedActionTypes = actionTypes.filter(
      (action) => action.key !== "error"
    );

    await knex("utils")
      .where("key", "ACTION_TYPE")
      .update({
        data: JSON.stringify(updatedActionTypes),
      });
  }
};
