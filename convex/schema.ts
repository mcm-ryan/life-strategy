import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  strategies: defineTable({
    userId: v.string(),
    answers: v.any(),
    strategyText: v.optional(v.string()),
    goals: v.optional(v.array(v.object({
      id: v.string(),
      category: v.string(),
      title: v.string(),
      metric: v.string(),
      unit: v.string(),
      currentValue: v.number(),
      targetValue: v.number(),
      deadline: v.optional(v.string()),
      trackingSources: v.array(v.string()),
    }))),
    isComplete: v.boolean(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),
})
