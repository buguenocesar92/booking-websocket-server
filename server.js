// Cargar variables de entorno
require('dotenv').config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const Redis = require("ioredis");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: "*" },
  path: '/ws'
});

// Middleware de autenticación para Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  console.log("Token recibido en handshake:", token);
  if (!token) {
    return next(new Error("Unauthorized: No token provided"));
  }
  try {
    const secret = process.env.JWT_SECRET || "byfH4cJZ5lLUPTWBuBssHsFlwTavJ0Mr09Nf59UfuFgXtRYIqQQeQ6WzR3u6ZMPl";
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    socket.data.user = decoded;
    console.log("Usuario decodificado:", decoded);
    next();
  } catch (err) {
    console.error("Error al verificar el token:", err);
    next(new Error("Unauthorized: Invalid token"));
  }
});

// Conexión a Redis
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379
});

// Suscribirse a los canales privados usando un patrón que incluya el prefijo
redis.psubscribe("laravel_database_private-chat-*", (err, count) => {
  if (err) {
    console.error("Error al suscribirse al patrón:", err);
  } else {
    console.log(`Suscrito a ${count} patrón(es)`);
  }
});

// Manejo de mensajes para canales privados (pmessage para patrones)
redis.on("pmessage", (pattern, channel, message) => {
  console.log(`Mensaje recibido en canal ${channel}: ${message}`);
  try {
    const data = JSON.parse(message);
    // Emitir el mensaje solo a los sockets suscritos a ese canal
    io.to(channel).emit("private-message", data);
  } catch (e) {
    console.error("Error al parsear el mensaje:", e);
  }
});

// Manejo de conexiones de Socket.io
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id, "Usuario:", socket.data.user);

  // Evento para unirse a un canal privado
  socket.on("join-private-channel", (data) => {
    // El cliente debe enviar el canal con el prefijo completo, por ejemplo: "laravel_database_private-chat-1"
    const channelName = data.channel;
    const expectedChannel = `laravel_database_private-chat-${socket.data.user.sub}`; // Usamos socket.data.user.sub (de tu token, por ejemplo "1")
    console.log("Canal recibido:", channelName);
    console.log("Canal esperado:", expectedChannel);
    
    if (channelName === expectedChannel) {
      socket.join(channelName);
      socket.emit("joined-channel", { channel: channelName });
      console.log(`Usuario ${socket.data.user.sub} se unió al canal ${channelName}`);
    } else {
      socket.emit("error", "No autorizado para unirse a este canal");
      console.log("Error: Canal no autorizado. El canal enviado no coincide con el esperado.");
    }
  });

  // Evento para enviar mensaje privado desde el cliente
  socket.on("send-private-message", (data) => {
    const { channel, message } = data;
    if (socket.rooms.has(channel)) { // En Socket.io v4, socket.rooms es un Set
      io.to(channel).emit("private-message", {
        user: socket.data.user,
        message: message
      });
      console.log(`Mensaje enviado al canal ${channel}: ${message}`);
    } else {
      socket.emit("error", "No estás en el canal privado");
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

const PORT = 4000;
server.listen(PORT, () => console.log(`Servidor WebSocket corriendo en el puerto ${PORT}`));
