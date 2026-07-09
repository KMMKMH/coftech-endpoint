const { Server } = require("socket.io");
// const { instrument } = require("@socket.io/admin-ui");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 1e8
  });

  // instrument(io,{
  //   auth: false
  // })

  return io;
};

const getSocket = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
};

module.exports = {
  initializeSocket,
  getSocket,
};
