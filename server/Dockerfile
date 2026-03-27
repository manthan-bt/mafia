# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
# Copy shared workspace
COPY shared ./shared
# Copy server workspace
COPY server ./server

# Install dependencies (only server and shared)
RUN npm install -w server -w shared

# Generate Prisma Client
WORKDIR /app/server
RUN npx prisma generate

# Build shared and server
WORKDIR /app
RUN npm run build -w shared -w server

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/prisma ./server/prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3005

EXPOSE 3005

CMD ["node", "server/dist/server.js"]
