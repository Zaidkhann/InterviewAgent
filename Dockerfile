# Use the official lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy local code to the container image
COPY . .

# Run the web service on container startup
CMD [ "node", "src/server.js" ]
