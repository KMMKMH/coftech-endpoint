const repoOrders = require("../repositories/orders");

const updateOrder = async (orderID, header, data) => {
  try {
    const [dataOrder] = await repoOrders.getOrderByField({
      "orders.uuid_unique": orderID,
    });

    let dataUpdate = {};
    let fieldsToUpdate;
    if (header === "NMI-Body-Type") {
      fieldsToUpdate = ["status", "reason", "extra3", "extra4"];
    } else if (header === "Woo-Body-Type") {
      fieldsToUpdate = ["extra1", "extra2", "status", "item"];
    }
    fieldsToUpdate.forEach((field) => {
      if (data[field] != undefined && data[field] != dataOrder[field]) {
        dataUpdate[field] = data[field];
      }
    });

    if (Object.keys(dataUpdate).length > 0) {
      return await repoOrders.updateOrder(
        { "orders.uuid_unique": orderID },
        dataUpdate
      );
    } else {
      return true;
    }
  } catch (e) {
    throw new Error(e);
  }
};
module.exports = {
  updateOrder,
};
