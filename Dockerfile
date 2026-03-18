# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer cache
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copy source and build in production mode
COPY . .
RUN npm run build -- --configuration production

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove the default nginx config and default html
RUN rm /etc/nginx/conf.d/default.conf \
    && rm -rf /usr/share/nginx/html/*

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Angular 19 application builder outputs to dist/<name>/browser
COPY --from=builder /app/dist/open-api-studio-web/browser /usr/share/nginx/html

# Run as non-root: nginx master needs root to bind, but workers drop to nginx user.
# Port 8080 is used in nginx.conf so no root is required for binding (<1024).
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
