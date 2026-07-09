const db = require("./db");
const dayjs = require("dayjs");
const logger = require("./logger");

const createEventToDeleteCard = async (cardData, expirationDate) => {
  try {
    const { id } = cardData;
    const eventName = `delete_card_${id}_${dayjs().format("YYYYMMDDHHmmss")}`;
    const currentDate = dayjs();

    let eventDate;
    if (
      currentDate.year() === expirationDate.year() &&
      currentDate.month() === expirationDate.month()
    ) {
      eventDate = currentDate.add(1, "day");
    } else {
      eventDate = expirationDate.startOf("month");
    }
    eventDate = eventDate.format("YYYY-MM-DD HH:mm");

    const query = `
      CREATE EVENT ${eventName}
      ON SCHEDULE AT '${eventDate}'
      ON COMPLETION NOT PRESERVE
      DO
      BEGIN 
        DELETE FROM payments_queue
        WHERE account_card_id = (SELECT uuid_unique FROM accounts_cards WHERE id = ${id});
        DELETE FROM accounts_cards WHERE id = ${id};
      END
    `;

    await db.raw(query);
    logger.info(`Event ${eventName} created to delete card`);
  } catch (error) {
    logger.error(`Error creating event to delete card`);
    throw new Error(error);
  }
};

module.exports = { createEventToDeleteCard };
