import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const priority = v.union(v.literal('low'), v.literal('medium'), v.literal('high'));
const status = v.union(
  v.literal('enrolled'),
  v.literal('escalated'),
  v.literal('in-progress'),
  v.literal('completed'),
  v.literal('rejected'),
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query('tasks')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
  },
});

export const create = mutation({
  args: {
    siteId: v.id('sites'),
    title: v.string(),
    description: v.string(),
    priority,
    status,
    dueDate: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const now = Date.now();
    return await ctx.db.insert('tasks', {
      ...args,
      userId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('tasks'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(priority),
    status: v.optional(status),
    dueDate: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { id, ...patch }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const task = await ctx.db.get(id);
    if (!task || task.userId !== identity.subject) throw new Error('Task not found');
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const task = await ctx.db.get(id);
    if (!task || task.userId !== identity.subject) throw new Error('Task not found');
    await ctx.db.delete(id);
  },
});
