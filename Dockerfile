# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Railway build-time variables
ARG RAILWAY_GIT_COMMIT_SHA=local
ARG RAILWAY_GIT_BRANCH=local
ARG RAILWAY_GIT_TAG=

# Copy dependency manifests first to leverage Docker layer cache
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copy source and build in production mode
COPY . .

# Resolve version: use git tag if available, otherwise use short commit SHA
# Then inject it into the production environment file before building
RUN SHORT_SHA=$(echo "$RAILWAY_GIT_COMMIT_SHA" | cut -c1-7) && \
    APP_VERSION="${RAILWAY_GIT_TAG:-$SHORT_SHA}" && \
    APP_VERSION="${APP_VERSION:-local}" && \
    echo "Building version: $APP_VERSION (branch: $RAILWAY_GIT_BRANCH)" && \
    sed -i "s/VERSION_PLACEHOLDER/$APP_VERSION/g" src/environments/environment.production.ts && \
    npm run build -- --configuration production

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
