const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./config");

const authMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token;
  console.log("Token recibido en handshake:", token);

  if (!token) {
    return next(new Error("Unauthorized: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    socket.data.user = decoded;
    console.log("Usuario decodificado:", decoded);
    next();
  } catch (err) {
    console.error("Error al verificar el token:", err);
    next(new Error("Unauthorized: Invalid token"));
  }
};

module.exports = authMiddleware;
