const { getSocket } = require("./socket");
const { createFilemanagerRoom } = require("./createRoomName");

const emitUploadProgress = (accountID, fileID, progress) => {
  const io = getSocket();
  if (io) {
    const room = createFilemanagerRoom(accountID);
    io.to(room).emit("upload_progress", { fileID, progress });
  }
};

const emitUploadComplete = (accountID, fileID, message) => {
  const io = getSocket();
  if (io) {
    const room = createFilemanagerRoom(accountID);
    io.to(room).emit("upload_complete", { fileID, message });
  }
};

module.exports = { emitUploadProgress, emitUploadComplete };
