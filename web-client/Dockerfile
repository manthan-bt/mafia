# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
# Copy shared workspace
COPY shared ./shared
# Copy web-client workspace
COPY web-client ./web-client

# Install dependencies (only web-client and shared)
RUN npm install -w web-client -w shared

# Build shared and web-client
RUN npm run build -w shared -w web-client

# Stage 2: Runtime (Nginx)
FROM nginx:stable-alpine
COPY --from=builder /app/web-client/dist /usr/share/nginx/html
# Custom Nginx config to handle SPA routing
COPY web-client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
