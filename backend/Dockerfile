# Node.js Backend Dockerfile
FROM node:20-alpine

# Install OpenSSL required by Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy Prisma schema BEFORE npm ci so postinstall (prisma generate) can find it
COPY prisma ./prisma

# Install dependencies (postinstall runs prisma generate - needs schema to exist first)
RUN npm ci

# Copy application code
COPY src ./src

# Expose port
EXPOSE 3001

# Start in production mode
CMD ["npm", "start"]
