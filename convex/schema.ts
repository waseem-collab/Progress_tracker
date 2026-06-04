import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  companies: defineTable({
    userId: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  sites: defineTable({
    userId: v.string(),
    companyId: v.id('companies'),
    name: v.string(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_company', ['companyId']),

  tasks: defineTable({
    userId: v.string(),
    siteId: v.id('sites'),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    status: v.union(
      v.literal('enrolled'),
      v.literal('escalated'),
      v.literal('in-progress'),
      v.literal('completed'),
      v.literal('rejected'),
    ),
    dueDate: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_site', ['siteId']),

  personalTasks: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.string(),
    dueDate: v.union(v.string(), v.null()),
    status: v.union(v.literal('enrolled'), v.literal('ongoing'), v.literal('completed')),
    priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),
});
