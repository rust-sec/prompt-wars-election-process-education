# ── Stage 1: Build React frontend ─────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build
# Output: /app/client/dist


# ── Stage 2: Production server image ──────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy Express server
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/

# Copy built React app from Stage 1
COPY --from=frontend-build /app/client/dist ./client/dist

# Cloud Run sets PORT env var automatically (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.js"]
