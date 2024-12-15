# Build stage
FROM node:18-slim as builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code and scripts
COPY src/ ./src/

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies including development dependencies for scripts
RUN npm install

# Generate Prisma client in production
RUN npx prisma generate

# Copy source files and built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

# Expose port 3000
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]