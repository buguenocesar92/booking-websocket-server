# Usa una imagen base oficial de Node.js
FROM node:18

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos del proyecto
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY . .

# Instala las dependencias
RUN npm install --omit=dev

# Expone el puerto del servidor WebSocket
EXPOSE 4000

# Comando para ejecutar el servidor
CMD ["node", "server.js"]
