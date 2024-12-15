# Use Node 18 slim as base image (smaller size)
FROM node:18-slim

# Set working directory in the container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose port 3000 (the port your app uses)
EXPOSE 3000

# Command to run your app
CMD ["npm", "start"]