# Use an official Node.js image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./

RUN npm install

# Command to run the application
CMD ["npm", "start"]