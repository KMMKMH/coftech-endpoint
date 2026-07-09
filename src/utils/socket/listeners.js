const jwt = require("jsonwebtoken");
const controllerBots = require("../../controllers/bots");
const repoAccounts = require("../../repositories/accounts");
const repoBots = require("../../repositories/bots");
const logger = require("../logger");
const { 
  createChatRoom, 
  createUserRoom, 
  createFilemanagerRoom
} = require("../socket/createRoomName");
const qrCache = require("../qr/qrCache");

const getRoomID = (payload) => {
  if (typeof payload === "string") return payload;
  return payload?.roomID || payload?.room_id;
};

const socketAuthMiddleware = async (socket, next) => {
  try {
    const { token } = socket.handshake.auth || {};

    if (!token) {
      return next(new Error("Token is missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [account] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": decoded.user,
    });

    if (!account) {
      return next(new Error("User not found"));
    }

    socket.user = {
      accountID: decoded.user,
      companyID: account.company_id,
      fullname: `${account.first_name} ${account.last_name}`,
    };

    next();
  } catch (err) { // eslint-disable-line
    next(new Error("Invalid or expired token"));
  }
};

async function autoRejoinAssignedChats(socket) {
  const { accountID, companyID } = socket.user;
  if (!accountID || !companyID) return;

  const assignedChats = await repoBots.getAssignedChatByField({
    "assigned_chats.user_id": accountID,
    "assigned_chats.company_id": companyID,
  });

  for (const chat of assignedChats) {
    const room = createChatRoom(accountID, chat.phone_number);
    socket.join(room);
  }
}

async function autoJoinUserRooms(socket) {
  const { accountID, companyID } = socket.user;
  if (!accountID || !companyID) return;

  const botRoom = createUserRoom(accountID);
  socket.join(botRoom);

  const qr = qrCache.get(accountID);
  if (qr) {
    setTimeout(() => {
      socket.emit("qr_generated", qr);
    }, 1200);
  }

  const filemanagerRoom = createFilemanagerRoom(accountID);
  socket.join(filemanagerRoom);

  await autoRejoinAssignedChats(socket);
}

const registerSocketHandlers = (io) => {
  io.use(socketAuthMiddleware);

  io.on("connection", async (socket) => {
    await autoJoinUserRooms(socket);

    logger.info(`Client Connected With ID ${socket.id}`);

    socket.on("join_room", async (room_id) => {
      socket.join(room_id);
    });

    socket.on("leave_room", async (room_id) => {
      socket.leave(room_id);
    });

    socket.on("join", async (payload) => {
      const roomID = getRoomID(payload);
      if (roomID) socket.join(roomID);
    });

    socket.on("leave", async (payload) => {
      const roomID = getRoomID(payload);
      if (roomID) socket.leave(roomID);
    });

    socket.on("join_file", (fileID) => {
      socket.join(fileID);
    });

    socket.on("connection_error", (error) => {
      logger.error(`Connection Error: ${JSON.stringify(error, null, 4)}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `Client disconnected: ${socket.id}. Reason ${JSON.stringify(reason)}`
      );
    });

    socket.on("signal", (data) => {
      socket.broadcast.emit("signal", data);
    });

    socket.on("chat:claim", async (data) => {
      await controllerBots.socketUpdateChatAgent(
        {
          ...data,
          accountID: socket.user.accountID,
          companyID: socket.user.companyID,
          action: "claim",
        },
        socket
      );
    });

    socket.on("chat:release", async (data) => {
      await controllerBots.socketUpdateChatAgent(
        {
          ...data,
          accountID: socket.user.accountID,
          companyID: socket.user.companyID,
          action: "release",
        },
        socket
      );
    });

    socket.on("message:send", async (data) => {
      await controllerBots.socketSendMessageBot(
        { ...data, accountID: socket.user.accountID },
        socket
      );
    });

    socket.on("chat:check_availability", async (data) => {
      await controllerBots.socketAvailableChat(
        { ...data, companyID: socket.user.companyID },
        socket
      );
    });
  });
};

module.exports = { registerSocketHandlers };
