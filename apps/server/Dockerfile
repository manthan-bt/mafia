# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
# Copy workspaces
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Install dependencies
RUN npm install -w @mafia/shared -w @mafia/server

# Generate Prisma Client
WORKDIR /app/apps/server
RUN npx prisma generate

# Build
WORKDIR /app
RUN npm run build -w @mafia/server

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3005

EXPOSE 3005

CMD ["node", "apps/server/dist/main.js"]
