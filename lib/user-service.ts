import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ResolvedUser {
  id: string;
  clerkId: string | null;
  tier: string;
}

export async function resolveUser(
  fingerprintId: string
): Promise<ResolvedUser> {
  const { userId: clerkUserId } = await auth();

  if (clerkUserId) {
    // Authenticated — look up by clerkId first
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (existing.length > 0) {
      return {
        id: existing[0].id,
        clerkId: existing[0].clerkId,
        tier: existing[0].tier,
      };
    }

    // Not found by clerkId — try linking to existing fingerprint user
    const fingerprinted = await db
      .select()
      .from(users)
      .where(eq(users.id, fingerprintId))
      .limit(1);

    if (fingerprinted.length > 0) {
      // Link account: set clerkId + upgrade to free
      await db
        .update(users)
        .set({ clerkId: clerkUserId, tier: "free" })
        .where(eq(users.id, fingerprintId));

      return { id: fingerprintId, clerkId: clerkUserId, tier: "free" };
    }

    // No existing user at all — create one linked to Clerk
    await db.insert(users).values({
      id: fingerprintId,
      clerkId: clerkUserId,
      tier: "free",
    });

    return { id: fingerprintId, clerkId: clerkUserId, tier: "free" };
  }

  // Anonymous — find or create by fingerprint
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, fingerprintId))
    .limit(1);

  if (existing.length > 0) {
    return {
      id: existing[0].id,
      clerkId: existing[0].clerkId,
      tier: existing[0].tier,
    };
  }

  await db.insert(users).values({ id: fingerprintId });

  return { id: fingerprintId, clerkId: null, tier: "anonymous" };
}
