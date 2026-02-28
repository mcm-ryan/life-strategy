import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const createStrategy = mutation({
  args: { answers: v.any() },
  handler: async (ctx, { answers }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const id = await ctx.db.insert('strategies', {
      userId: identity.subject,
      answers,
      isComplete: false,
      createdAt: Date.now(),
    })
    return id
  },
})

export const saveStrategyText = mutation({
  args: { id: v.id('strategies'), text: v.string() },
  handler: async (ctx, { id, text }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const strategy = await ctx.db.get(id)
    if (!strategy || strategy.userId !== identity.subject) {
      throw new Error('Not found')
    }

    await ctx.db.patch(id, { strategyText: text, isComplete: true })
  },
})

export const getStrategy = query({
  args: { id: v.id('strategies') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const strategy = await ctx.db.get(id)
    if (!strategy || strategy.userId !== identity.subject) return null
    return strategy
  },
})

const goalValidator = v.object({
  id: v.string(),
  category: v.string(),
  title: v.string(),
  metric: v.string(),
  unit: v.string(),
  currentValue: v.number(),
  targetValue: v.number(),
  deadline: v.optional(v.string()),
  trackingSources: v.array(v.string()),
})

export const saveAnonymousStrategy = mutation({
  args: {
    answers: v.any(),
    strategyText: v.string(),
    goals: v.array(goalValidator),
  },
  handler: async (ctx, { answers, strategyText, goals }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const id = await ctx.db.insert('strategies', {
      userId: identity.subject,
      answers,
      strategyText,
      goals,
      isComplete: true,
      createdAt: Date.now(),
    })
    return id
  },
})

export const listUserStrategies = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    return await ctx.db
      .query('strategies')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .collect()
  },
})
