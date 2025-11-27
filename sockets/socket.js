// sockets/socket.js
require("dotenv").config();
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

/**
 * Initializes Socket.IO on an existing HTTP server.
 * - Verifies token from handshake.auth.token
 * - Puts each connected client into a room named by userId
 * - Emits/receives simple events
 */
module.exports = function initSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://taskflow-backend-4y7q.onrender.com",
        "https://task-workflow-manager-frontend.onrender.com",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    try {
      // token-based auth from client (handshake.auth)
      const token = socket.handshake.auth?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.id;
          socket.join(userId); // join a room per user
          socket.userId = userId;
          console.log("Socket connected:", socket.id, "user:", userId);
        } catch (err) {
          console.warn("Socket auth failed:", err.message);
        }
      } else {
        console.log("Socket connected (no token):", socket.id);
      }

      // allow client to join specific rooms manually
      socket.on("join", (room) => {
        socket.join(room);
      });

      socket.on("leave", (room) => {
        socket.leave(room);
      });

      socket.on("disconnect", () => {
        // cleanup if needed
      });
    } catch (err) {
      console.error("Socket connection error:", err);
    }
  });

  // expose io via global for ease of use in controllers/services
  global.io = io;
  return io;
};
