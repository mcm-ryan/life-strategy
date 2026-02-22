import { createFileRoute } from '@tanstack/react-router'
// Side-effect import to activate TanStack Start's server route type augmentation
import '@tanstack/react-start'
import Anthropic from '@anthropic-ai/sdk'

// ---------------------------------------------------------------------------
// Rate limiting — fixed window, per IP, backed by Redis (ioredis)
// ---------------------------------------------------------------------------
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
})
redis.on('error', () => {}) // suppress unhandled error events

const RATE_LIMIT = 3       // max requests per window
const WINDOW_SECS = 60 * 60  // 1 hour

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

async function isRateLimited(ip: string): Promise<boolean> {
  const key = `rl:${ip}`
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

Be direct, practical, and encouraging. Use their specific details to make every recommendation highly personalized. Include realistic timelines and specific numbers where possible. Format with clear headers and bullet points.`

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
- Financial Goals: ${data.financialGoals || 'Not provided'}
- Financial Challenges: ${data.financialChallenges || 'Not provided'}

**Life Vision:**
- Definition of happiness: ${data.happinessDefinition || 'Not provided'}
- 1-Year Goals: ${data.shortTermGoals || 'Not provided'}
- 5+ Year Goals: ${data.longTermGoals || 'Not provided'}
- Biggest Obstacle: ${data.biggestObstacle || 'Not provided'}

Please provide a detailed, actionable strategy to help ${data.name || 'this person'} progress toward being happy, healthy, and wealthy.`
}

export const Route = createFileRoute('/api/strategy')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request)
        if (await isRateLimited(ip)) {
          return new Response(
            JSON.stringify({ error: 'Too many requests. You can generate up to 3 strategies per hour.' }),
            { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' } },
          )
        }

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
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

        const client = new Anthropic({ apiKey })

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()
            try {
              const response = client.messages.stream({
                model: 'claude-opus-4-6',
                max_tokens: 8192,
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
