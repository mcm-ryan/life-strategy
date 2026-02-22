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

```bash
bun install
cp .env.example .env   # add your ANTHROPIC_API_KEY and REDIS_URL
bun run dev            # starts on http://localhost:3000
```

A Redis instance is required. For local development you can run one with Docker:

```bash
docker run -p 6379:6379 redis
```

Or use a free [Upstash](https://upstash.com) database and paste the Redis URL into your `.env`.

Other commands:

```bash
bun run build    # production build (outputs to .output/)
bun run preview  # preview the production build
bun run test     # run tests
```
