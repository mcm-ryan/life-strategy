import { createFileRoute } from '@tanstack/react-router'
// Side-effect import to activate TanStack Start's server route type augmentation
import '@tanstack/react-start'
import Anthropic from '@anthropic-ai/sdk'
import { createClerkClient } from '@clerk/backend'

// ---------------------------------------------------------------------------
// Rate limiting — fixed window, per user or IP, backed by Redis (ioredis)
// ---------------------------------------------------------------------------
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
})
redis.on('error', () => {}) // suppress unhandled error events

const RATE_LIMIT = 3       // max requests per window
const WINDOW_SECS = 60 * 60  // 1 hour

async function isRateLimited(key: string): Promise<boolean> {
  try {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, WINDOW_SECS)
    }
    return count > RATE_LIMIT
  } catch {
    // If Redis is unavailable, fail open so the app stays up
    console.error('[rate-limit] Redis unavailable, skipping rate limit check')
    return false
  }
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

async function getUserId(request: Request): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY
  const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY
  if (!secretKey || !publishableKey) return null

  try {
    const clerk = createClerkClient({ secretKey })
    const state = await clerk.authenticateRequest(request, { publishableKey })
    if (!state.isSignedIn) return null
    return state.toAuth().userId
  } catch {
    return null
  }
}

const SYSTEM_PROMPT = `You are a world-class life coach and strategic advisor. Your role is to create comprehensive, personalized life strategies that help people achieve happiness, health, and wealth simultaneously.

When given information about a person, create a structured, actionable strategy covering these sections:

# [Name]'s Life Strategy

## Executive Summary
A brief 2-3 sentence overview of where they are and where they're headed.

## Health & Wellness Strategy
Specific, tailored recommendations for physical and mental wellbeing based on their current fitness level, diet, and health goals.

## Career & Skills Strategy
A clear path to career growth, skill development, and professional fulfillment.

## Financial Strategy
Concrete, prioritized steps toward financial independence and wealth building based on their current situation.

## Happiness & Fulfillment Strategy
Actions to increase joy, purpose, and life satisfaction by leveraging their specific interests and values.

## 90-Day Action Plan
10-15 specific, prioritized actions to take in the next 90 days — a mix of quick wins and foundation-builders. Be very specific.

## Key Mindset Shifts
2-3 mental reframes that will help them most based on their situation.

Be direct, practical, and encouraging. Use their specific details to make every recommendation highly personalized. Include realistic timelines and specific numbers where possible. Format with clear headers and bullet points.

---

After completing the full narrative strategy above, append a structured goals block in EXACTLY this format (no deviations):

---GOALS_JSON---
{"goals":[
  {
    "id": "unique_snake_case_id",
    "category": "health",
    "title": "Human-readable goal title",
    "metric": "body_weight",
    "unit": "lbs",
    "currentValue": 200,
    "targetValue": 175,
    "deadline": "YYYY-MM-DD",
    "trackingSources": ["apple_health", "fitbit", "manual"]
  }
]}
---END_GOALS---

Rules for the goals JSON:
- Include 4-7 goals only where the user's data justifies a specific numeric target
- Use ONLY these standardized metric names: body_weight, daily_steps, sleep_hours, workout_frequency, monthly_savings, debt_balance, savings_balance, net_worth
- Units: body_weight (lbs or kg), daily_steps (steps/day), sleep_hours (hours/night), workout_frequency (days/week), monthly_savings (USD/month), debt_balance (USD), savings_balance (USD), net_worth (USD)
- trackingSources must be a subset of: ["apple_health", "fitbit", "manual", "plaid"]
- deadline must be a real future date in YYYY-MM-DD format based on today's date (${new Date().toISOString().slice(0, 10)})
- The JSON must be valid — no trailing commas, no comments`

function buildPrompt(data: Record<string, string>): string {
  const height = data.heightFt
    ? `${data.heightFt}'${data.heightIn ?? '0'}"`
    : 'Not provided'

  return `Please create a comprehensive life strategy for the following person:

**Personal Information:**
- Name: ${data.name || 'Not provided'}
- Age: ${data.age || 'Not provided'}
- Weight: ${data.weight ? `${data.weight} ${data.weightUnit || ''}` : 'Not provided'}
- Height: ${height}

**Health & Wellness:**
- Fitness Level: ${data.fitnessLevel || 'Not provided'}
- Sleep: ${data.sleepHours ? `${data.sleepHours} hours/night` : 'Not provided'}
- Target Weight: ${data.targetWeight ? `${data.targetWeight} ${data.weightUnit || 'lbs'}` : 'Not provided'}
- Current Daily Steps: ${data.dailySteps ? `${data.dailySteps} steps/day` : 'Not provided'}
- Health Goals: ${data.healthGoals || 'Not provided'}
- Diet: ${data.dietDescription || 'Not provided'}

**Interests & Skills:**
- Hobbies: ${data.hobbies || 'Not provided'}
- What brings joy: ${data.joyActivities || 'Not provided'}
- Skills: ${data.skills || 'Not provided'}

**Career:**
- Occupation: ${data.currentOccupation || 'Not provided'}
- Experience: ${data.yearsExperience ? `${data.yearsExperience} years` : 'Not provided'}
- Career Satisfaction: ${data.careerSatisfaction ? `${data.careerSatisfaction}/10` : 'Not provided'}
- Career Goals: ${data.careerGoals || 'Not provided'}

**Finances:**
- Annual Income: ${data.annualIncome || 'Not provided'}
- Net Worth: ${data.netWorth || 'Not provided'}
- Monthly Savings Capacity: ${data.monthlySavings ? `$${data.monthlySavings}/month` : 'Not provided'}
- Financial Goals: ${data.financialGoals || 'Not provided'}
- Financial Challenges: ${data.financialChallenges || 'Not provided'}

**Life Vision:**
- Definition of happiness: ${data.happinessDefinition || 'Not provided'}
- 1-Year Goals: ${data.shortTermGoals || 'Not provided'}
- 5+ Year Goals: ${data.longTermGoals || 'Not provided'}
- Biggest Obstacle: ${data.biggestObstacle || 'Not provided'}

Please provide a detailed, actionable strategy to help ${data.name || 'this person'} progress toward being happy, healthy, and wealthy. Remember to append the ---GOALS_JSON--- block at the very end.`
}

export const Route = createFileRoute('/api/strategy')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const isMock = process.env.MOCK_STRATEGY === 'true'
        const skipRateLimit = process.env.SKIP_RATE_LIMIT === 'true'

        const userId = await getUserId(request)
        const rateLimitKey = userId
          ? `rl:user:${userId}`
          : `rl:ip:${getClientIp(request)}`

        if (!skipRateLimit && await isRateLimited(rateLimitKey)) {
          return new Response(
            JSON.stringify({ error: 'Too many requests. You can generate up to 3 strategies per hour.' }),
            { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' } },
          )
        }

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!isMock && !apiKey) {
          return new Response(
            JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }

        let data: Record<string, string>
        try {
          data = (await request.json()) as Record<string, string>
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const MOCK_RESPONSE = `# ${data.name || 'Your'}'s Life Strategy

## Executive Summary
You are at an exciting inflection point. With a clear focus on health, career growth, and financial discipline, the next 12 months can be transformational. This strategy gives you a concrete roadmap.

## Health & Wellness Strategy
- Commit to 4 strength training sessions per week, starting with a push/pull/legs split
- Aim for 7–8 hours of sleep per night by setting a hard cutoff at 10:30 PM
- Increase daily steps to 8,000 by adding a 20-minute walk after lunch
- Reduce processed food intake; prep meals on Sundays to avoid weekday decisions

## Career & Skills Strategy
- Identify the one skill most valued in your industry and spend 30 minutes per day on it
- Schedule a career conversation with your manager every quarter to surface growth opportunities
- Build a portfolio of side projects or writing to increase your visibility outside your current role

## Financial Strategy
- Build a 3-month emergency fund as your first priority before investing
- Automate $500/month to a low-cost index fund (e.g., VTI or VTSAX)
- Track all spending for 30 days to find and eliminate your biggest leak
- Pay off any high-interest debt (>7%) before accelerating investing

## Happiness & Fulfillment Strategy
- Reserve one evening per week for a hobby with no productivity pressure
- Invest in two or three deep friendships rather than spreading yourself thin socially
- Practice a 5-minute daily reflection to stay connected to what matters most

## 90-Day Action Plan
1. Set up automatic savings transfer this week
2. Schedule your first workout this week — pick a specific day and time
3. Download a sleep tracking app and review your baseline
4. Block 30 minutes each morning for your priority skill
5. Meal prep for the first time this Sunday
6. Book a quarterly career check-in with your manager
7. Calculate your current net worth as a baseline
8. Identify and cancel one subscription you don't use
9. Take a 20-minute walk every day for 2 weeks to build the habit
10. Write down your top 3 personal values and review them weekly

## Key Mindset Shifts
- **Progress over perfection:** A 70% effort done consistently beats a perfect plan started never.
- **Systems beat willpower:** Design your environment so the right choices are the easy choices.
- **Invest in yourself first:** Time and money spent on your health and skills compound just like financial assets.

---GOALS_JSON---
{"goals":[
  {
    "id": "body_weight_goal",
    "category": "health",
    "title": "Reach target weight",
    "metric": "body_weight",
    "unit": "lbs",
    "currentValue": ${data.weight || 185},
    "targetValue": ${data.targetWeight || 170},
    "deadline": "${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}",
    "trackingSources": ["apple_health", "manual"]
  },
  {
    "id": "daily_steps_goal",
    "category": "health",
    "title": "Hit 8,000 steps daily",
    "metric": "daily_steps",
    "unit": "steps/day",
    "currentValue": ${data.dailySteps || 4000},
    "targetValue": 8000,
    "deadline": "${new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}",
    "trackingSources": ["apple_health", "fitbit"]
  },
  {
    "id": "monthly_savings_goal",
    "category": "finance",
    "title": "Save $500/month consistently",
    "metric": "monthly_savings",
    "unit": "USD/month",
    "currentValue": ${data.monthlySavings || 200},
    "targetValue": 500,
    "deadline": "${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}",
    "trackingSources": ["plaid", "manual"]
  },
  {
    "id": "sleep_hours_goal",
    "category": "health",
    "title": "Sleep 7.5 hours per night",
    "metric": "sleep_hours",
    "unit": "hours/night",
    "currentValue": ${data.sleepHours || 6},
    "targetValue": 7.5,
    "deadline": "${new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}",
    "trackingSources": ["apple_health", "fitbit"]
  }
]}
---END_GOALS---`

        const client = isMock ? null : new Anthropic({ apiKey: apiKey! })

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()
            try {
              if (isMock) {
                // Stream mock response in small chunks to simulate real streaming
                const chunkSize = 50
                for (let i = 0; i < MOCK_RESPONSE.length; i += chunkSize) {
                  controller.enqueue(
                    encoder.encode(MOCK_RESPONSE.slice(i, i + chunkSize)),
                  )
                  await new Promise((r) => setTimeout(r, 20))
                }
                return
              }

              const response = client!.messages.stream({
                model: 'claude-opus-4-6',
                max_tokens: 16000,
                thinking: { type: 'adaptive' },
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: buildPrompt(data) }],
              })

              for await (const event of response) {
                if (
                  event.type === 'content_block_delta' &&
                  event.delta.type === 'text_delta'
                ) {
                  controller.enqueue(encoder.encode(event.delta.text))
                }
              }
            } catch (err) {
              const msg =
                err instanceof Error ? err.message : 'Unknown error occurred'
              controller.enqueue(
                encoder.encode(`\n\nError generating strategy: ${msg}`),
              )
            } finally {
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff',
          },
        })
      },
    },
  },
})
