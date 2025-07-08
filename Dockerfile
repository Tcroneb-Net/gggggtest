FROM node:20-alpine

WORKDIR /usr/src/app

# Show files to debug missing package.json
RUN ls -la .

COPY package*.json ./

RUN ls -la . && npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
