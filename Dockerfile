# Multi-stage build: compile the React client, then run the API which also
# serves the built client (NODE_ENV=production).

# ---- Stage 1: build the client ----
FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./

# Optional map tiles at build time (client/.env is not copied into the image).
ARG VITE_MAPTILER_KEY=""
ARG VITE_MAP_STYLE="streets-v2"
ENV VITE_MAPTILER_KEY=$VITE_MAPTILER_KEY
ENV VITE_MAP_STYLE=$VITE_MAP_STYLE
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/server

# Install only production dependencies.
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Server source + the client build from stage 1.
COPY server/ ./
COPY --from=client /app/client/dist /app/client/dist

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
