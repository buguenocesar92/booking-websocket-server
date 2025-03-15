const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { PORT } = require("./config");
const authMiddleware = require("./authMiddleware");
const { redis, subscribeToChannels } = require("./redisHandler");
const socketHandler = require("./socketHandler");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, { 
  cors: { origin: "*" },
  path: "/ws",
});

// Aplicar middleware de autenticación a WebSockets
io.use(authMiddleware);

// Suscribirse a los canales de Redis
subscribeToChannels(io);

// Manejar eventos de WebSockets
socketHandler(io);

server.listen(PORT, () => console.log(`Servidor WebSocket corriendo en el puerto ${PORT}`));
