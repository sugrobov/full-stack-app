FROM node:22-alpine

WORKDIR /app

# Копируем package файлы и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --omit=dev

# Копируем остальные файлы сервера
COPY . .

# Открываем порт 5000
EXPOSE 5000

# Запускаем сервер
CMD ["node", "server.js"]