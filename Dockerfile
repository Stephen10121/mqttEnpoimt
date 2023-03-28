FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV WEBSOCKET_PORT=5502

EXPOSE 5502

CMD [ "npm", "start" ]