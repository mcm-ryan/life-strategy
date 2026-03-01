# ── Build stage ────────────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies first (layer-cache friendly)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
ARG VITE_CONVEX_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN bun run build

# ── Production stage ───────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Copy only the Nitro server output — no source, no node_modules needed
COPY --from=builder /app/.output ./.output

ENV NODE_ENV=production
ENV PORT=3000
# Bun writes its compile cache to $HOME/.cache/bun — set HOME to /tmp so it
# always has a writable location regardless of the container runtime user.
ENV HOME=/tmp

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
