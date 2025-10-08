# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npm run prisma:generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm install --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Expose port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]
