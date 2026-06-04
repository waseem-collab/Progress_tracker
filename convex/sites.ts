import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query('sites')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
  },
});

export const create = mutation({
  args: { companyId: v.id('companies'), name: v.string() },
  handler: async (ctx, { companyId, name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    // Verify the company belongs to this user
    const company = await ctx.db.get(companyId);
    if (!company || company.userId !== identity.subject) {
      throw new Error('Company not found');
    }

    return await ctx.db.insert('sites', {
      userId: identity.subject,
      companyId,
      name,
      createdAt: Date.now(),
    });
  },
});
