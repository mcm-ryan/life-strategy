# ── Build stage ────────────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies first (layer-cache friendly)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# ── Production stage ───────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Copy only the Nitro server output — no source, no node_modules needed
COPY --from=builder /app/.output ./.output

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
