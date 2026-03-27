# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
# Copy workspaces
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Install dependencies
RUN npm install -w @mafia/shared -w @mafia/web

# Build
RUN npm run build -w @mafia/shared -w @mafia/web

# Stage 2: Runtime (Nginx)
FROM nginx:stable-alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# Custom Nginx config to handle SPA routing
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
