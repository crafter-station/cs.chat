import { Webhooks } from "@polar-sh/nextjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onSubscriptionActive: async (payload) => {
    const customerId = payload.data.customerId;
    const externalId = payload.data.customer?.externalId;
    if (!externalId) return;

    // externalId is the Clerk userId — update tier to paid
    await db
      .update(users)
      .set({ tier: "paid", polarCustomerId: customerId })
      .where(eq(users.clerkId, externalId));
  },

  onSubscriptionCanceled: async (payload) => {
    const customerId = payload.data.customerId;

    // Downgrade back to free
    await db
      .update(users)
      .set({ tier: "free" })
      .where(eq(users.polarCustomerId, customerId));
  },

  onSubscriptionRevoked: async (payload) => {
    const customerId = payload.data.customerId;

    // Subscription fully ended — downgrade to free
    await db
      .update(users)
      .set({ tier: "free" })
      .where(eq(users.polarCustomerId, customerId));
  },

  onSubscriptionUncanceled: async (payload) => {
    const customerId = payload.data.customerId;

    // Re-activated — upgrade back to paid
    await db
      .update(users)
      .set({ tier: "paid" })
      .where(eq(users.polarCustomerId, customerId));
  },
});
