# Use an official Node.js image
FROM node:20


WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "start"]