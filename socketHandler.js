const socketHandler = (io) => {
    io.on("connection", (socket) => {
      console.log("Cliente conectado:", socket.id, "Usuario:", socket.data.user);
  
      // Unirse a un canal privado de reservas
      socket.on("join-private-channel", (data) => {
        const channelName = data.channel;
        const expectedChannel = `laravel_database_private-reservations.${socket.data.user.sub}`;
        
        console.log("Canal recibido:", channelName);
        console.log("Canal esperado:", expectedChannel);
  
        if (channelName === expectedChannel) {
          socket.join(channelName);
          socket.emit("joined-channel", { channel: channelName });
          console.log(`Usuario ${socket.data.user.sub} se unió al canal ${channelName}`);
        } else {
          socket.emit("error", "No autorizado para unirse a este canal");
        }
      });
  
      // Enviar mensaje privado
      socket.on("send-private-message", (data) => {
        const { channel, message } = data;
        if (socket.rooms.has(channel)) {
          io.to(channel).emit("private-message", {
            user: socket.data.user,
            message: message,
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
  };
  
  module.exports = socketHandler;
  