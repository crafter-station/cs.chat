"use server";

import { db } from "@/db";
import { users, threads, messages } from "@/db/schema";
import type { ChatThread } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { UIMessage } from "ai";

// Ensure a user row exists for this visitorId (upsert)
export async function getOrCreateUser(userId: string): Promise<void> {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!existing) {
    await db.insert(users).values({ id: userId }).onConflictDoNothing();
  }
}

export async function fetchThreads(userId: string): Promise<ChatThread[]> {
  return db
    .select()
    .from(threads)
    .where(eq(threads.userId, userId))
    .orderBy(desc(threads.createdAt));
}

export async function createThreadAction(
  id: string,
  model: string,
  userId: string
): Promise<ChatThread> {
  // Ensure user exists before creating thread
  await getOrCreateUser(userId);
  const [thread] = await db
    .insert(threads)
    .values({ id, model, userId })
    .returning();
  return thread;
}

export async function updateThreadTitleAction(
  id: string,
  title: string
): Promise<void> {
  await db
    .update(threads)
    .set({ title, updatedAt: new Date() })
    .where(eq(threads.id, id));
}

export async function updateThreadModelAction(
  id: string,
  model: string
): Promise<void> {
  await db
    .update(threads)
    .set({ model, updatedAt: new Date() })
    .where(eq(threads.id, id));
}

export async function deleteThreadAction(id: string): Promise<void> {
  await db.delete(threads).where(eq(threads.id, id));
}

export async function fetchMessages(threadId: string): Promise<UIMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(messages.createdAt);
  return rows.map((r) => r.content as UIMessage);
}

export async function saveMessagesAction(
  threadId: string,
  msgs: UIMessage[]
): Promise<void> {
  await db.delete(messages).where(eq(messages.threadId, threadId));
  if (msgs.length > 0) {
    await db.insert(messages).values(
      msgs.map((m) => ({
        id: m.id,
        threadId,
        content: m,
      }))
    );
  }
}
