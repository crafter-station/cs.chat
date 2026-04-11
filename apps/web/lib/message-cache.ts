import type { UIMessage } from "ai";
import { fetchMessages } from "./thread-actions";

const cache = new Map<string, UIMessage[]>();

export function getCachedMessages(threadId: string): UIMessage[] | undefined {
  return cache.get(threadId);
}

export function setCachedMessages(
  threadId: string,
  messages: UIMessage[]
): void {
  cache.set(threadId, messages);
}

export function clearCachedMessages(threadId: string): void {
  cache.delete(threadId);
}

/** Prefetch messages for a thread (no-op if already cached). */
export async function prefetchMessages(threadId: string): Promise<void> {
  if (cache.has(threadId)) return;
  const msgs = await fetchMessages(threadId);
  cache.set(threadId, msgs);
}
