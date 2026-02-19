# Node.js Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy Prisma
COPY prisma ./prisma

# Generate Prisma Client
RUN npm exec prisma generate

# Copy application code
COPY src ./src

# Expose port
EXPOSE 3001

# Start in production mode
CMD ["npm", "start"]
