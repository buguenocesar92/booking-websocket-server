const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Conexión a Redis (ajusta la configuración si es necesario)
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379
});

// Suscribirse al canal que usa Laravel (por ejemplo, "chat" o "laravel_database_chat")
redis.subscribe("laravel_database_chat", (err, count) => {
  if (err) {
    console.error("Error al suscribirse a Redis:", err);
  } else {
    console.log(`Suscrito a ${count} canal(es)`);
  }
});

redis.on("message", (channel, message) => {
  console.log(`Mensaje recibido en el canal ${channel}: ${message}`);
  try {
    const data = JSON.parse(message);
    io.emit("new-message", data);
  } catch (e) {
    console.error("Error al parsear el mensaje:", e);
  }
});

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);
  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Servidor WebSocket corriendo en el puerto ${PORT}`));
