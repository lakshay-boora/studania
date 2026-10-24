# ── Angvey — single-image production build ──────────────────────────────────
# Stage 1: build the React client
FROM node:20-alpine AS web-build
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Stage 2: API server + static client
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY --from=web-build /app/web/dist ./web/dist

ENV ANGVEY_PORT=8787 ANGVEY_HOST=0.0.0.0
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://127.0.0.1:8787/api/health || exit 1
CMD ["node", "server/src/index.js"]
