# =============================================================================
# launchdarkly-ai Dockerfile
# =============================================================================
# Single-stage. Express + LD AI SDK + Anthropic SDK, all running on Node 20.
# Reads LD_SDK_KEY and ANTHROPIC_API_KEY from the runtime environment;
# docker-compose.yml at the repo root passes them through from the .env file.
# =============================================================================

FROM node:20-alpine

WORKDIR /app

# Dependency manifest first so Docker can cache the install layer separately
# from source changes.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy the rest of the source (server.js + public/).
COPY . .

# Run as the unprivileged `node` user that the official image ships with —
# safer than running the server as root, no measurable cost.
USER node

# 3001 matches the README and the default in server.js.
EXPOSE 3001

CMD ["node", "server.js"]
