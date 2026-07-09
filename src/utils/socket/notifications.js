const { getSocket } = require("./socket");

const emitNotification = (roomID, event, message) => {
  const io = getSocket();
  if (io) {
    io.to(roomID).emit(event, message);
    console.log(
      `Notification emitted to room ${roomID}: ${event} - ${JSON.stringify(
        message
      )}`
    );
    return true;
  }
  return false;
};

module.exports = { emitNotification };
