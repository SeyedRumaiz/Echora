# ==============================================================================
# ECHORA - Production Dockerfile for Google Cloud Run
# Optimized for Google Cloud Gen AI Academy APAC Ideathon
# ==============================================================================

# Build Stage
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package.json ./
RUN npm install

# Copy application source code
COPY . .

# Compile Vite frontend & bundle Express server with esbuild
RUN npm run build

# Production Runner Stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy manifests and install production dependencies only
COPY package.json ./
RUN npm install --omit=dev

# Copy compiled frontend and bundled server from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firestore.rules ./firestore.rules

# Cloud Run ingress port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Launch compiled CommonJS server bundle
CMD ["node", "dist/server.cjs"]
