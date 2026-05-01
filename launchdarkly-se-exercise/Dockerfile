# =============================================================================
# launchdarkly-se-exercise Dockerfile
# =============================================================================
# Multi-stage build:
#   Stage 1 (builder)  - Node 20 alpine, runs `vite build` to produce dist/
#   Stage 2 (runner)   - nginx alpine, serves the static dist/ on port 80
#
# Why a static-server runtime instead of `vite preview`?
# `vite preview` is documented as a development convenience, not a production
# server. nginx is a few MB, battle-tested, and handles SPA routing trivially
# with the try_files directive in nginx.conf below.
#
# Why pass VITE_LD_CLIENT_SIDE_ID as a build-arg?
# Vite reads VITE_* env vars at BUILD TIME and bakes their values into the
# emitted JavaScript bundle. They cannot be changed at container start. So
# the LaunchDarkly client-side ID is a build-arg, not a runtime env var.
# docker-compose.yml at the repo root passes it through automatically.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first, separately from copying source. This lets Docker cache
# the npm install layer when only source files change.
COPY package.json ./
# package-lock.json is intentionally not committed (see top-level README);
# `npm install` will resolve fresh on each build.
RUN npm install --no-audit --no-fund

# Copy the rest of the source.
COPY . .

# Vite reads this at build time and bakes it into the bundle.
# Provide a placeholder default so `docker build` without --build-arg still
# completes; the resulting bundle would error at runtime with the same
# friendly "Missing client-side ID" message that the dev server shows.
ARG VITE_LD_CLIENT_SIDE_ID=""
ENV VITE_LD_CLIENT_SIDE_ID=${VITE_LD_CLIENT_SIDE_ID}

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: serve
# -----------------------------------------------------------------------------
FROM nginx:alpine AS runner

# SPA routing: any unmatched route should fall back to index.html so React
# Router's client-side routes (/exercise-1, /exercise-2, etc.) work on direct
# navigation and refresh.
RUN printf '%s\n' \
    'server {' \
    '  listen 80;' \
    '  server_name _;' \
    '  root /usr/share/nginx/html;' \
    '  index index.html;' \
    '  location / {' \
    '    try_files $uri $uri/ /index.html;' \
    '  }' \
    '  # Long-cache the hashed asset files Vite emits.' \
    '  location /assets/ {' \
    '    expires 1y;' \
    '    add_header Cache-Control "public, immutable";' \
    '  }' \
    '}' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
