# Node.js Backend Dockerfile
FROM node:20-alpine

# Install dependencies required by Prisma and some native modules
RUN apk add --no-cache openssl g++ make python3 libstdc++

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

CMD ["npm", "start"]
