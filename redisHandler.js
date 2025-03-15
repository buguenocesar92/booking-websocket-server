const Redis = require("ioredis");
const { REDIS_HOST, REDIS_PORT } = require("./config");

const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

const subscribeToChannels = (io) => {
  const pattern = "laravel_database_private-reservations.*";
  redis.psubscribe(pattern, (err, count) => {
    if (err) {
      console.error("Error al suscribirse al patrón:", err);
    } else {
      console.log(`Suscrito a ${count} patrón(es) de reservas`);
    }
  });

  redis.on("pmessage", (pattern, channel, message) => {
    console.log(`Mensaje recibido en canal ${channel}: ${message}`);
    try {
      const data = JSON.parse(message);
      io.to(channel).emit("private-message", data);
    } catch (e) {
      console.error("Error al parsear el mensaje:", e);
    }
  });
};

module.exports = { redis, subscribeToChannels };
