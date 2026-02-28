# Life Strategy

Answer a few questions about yourself and receive a comprehensive, AI-powered strategy to become happier, healthier, and wealthier. Powered by Claude Opus.

![alt text](public/image-1.png)

The app walks you through a 6-step questionnaire covering your health, interests, career, finances, and goals, then streams a personalized strategy back to you in real time.

![alt text](public/image.png)

## Running with Docker

```bash
docker build -t life-strategy .
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your-key-here \
  -e REDIS_URL=rediss://default:<password>@<host>:6379 \
  life-strategy
```

Then open [http://localhost:3000](http://localhost:3000).

## Local Development

### 1. Install dependencies

```bash
bun install
cp .env.example .env
```

### 2. Set up Clerk (auth)

1. Create a free account at [clerk.com](https://clerk.com) and create a new application.
2. In the Clerk dashboard, go to **API Keys** and copy your keys into `.env`:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Make sure **Email** and/or **Google** sign-in are enabled under **User & Authentication → Social connections**.

### 3. Set up Convex (database)

Install the Convex CLI and link it to a project:

```bash
bunx convex dev
```

On first run this will prompt you to log in and create a project. It then:
- Generates `convex/_generated/` (the typed API client)
- Prints your `CONVEX_URL` — copy it into `.env`:

```
VITE_CONVEX_URL=https://your-project.convex.cloud
```

**Keep this terminal running** while developing — it syncs schema changes and hot-reloads your Convex functions.

### 4. Set up Redis (rate limiting)

Run a local Redis instance:

```bash
docker run -p 6379:6379 redis
```

Or use a free [Upstash](https://upstash.com) database and set `REDIS_URL` in `.env`.

### 5. Start the dev server

In a second terminal:

```bash
bun run dev   # http://localhost:3000
```

### Full `.env` reference

```
ANTHROPIC_API_KEY=sk-ant-...
REDIS_URL=redis://localhost:6379
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Other commands

```bash
bun run build    # production build (outputs to .output/)
bun run preview  # preview the production build
bun run test     # run tests
```

## Deployment

**Convex:** push your schema and functions to the cloud:

```bash
bunx convex deploy
```

Set `VITE_CONVEX_URL` to the resulting cloud URL in your hosting environment.

**Clerk:** switch to a production instance in the Clerk dashboard and use your `pk_live_` / `sk_live_` keys.

**Docker:**

```bash
docker build -t life-strategy .
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=... \
  -e REDIS_URL=... \
  -e VITE_CONVEX_URL=... \
  -e VITE_CLERK_PUBLISHABLE_KEY=... \
  -e CLERK_SECRET_KEY=... \
  life-strategy
```
