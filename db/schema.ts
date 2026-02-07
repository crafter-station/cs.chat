import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // fingerprint visitorId
  clerkId: text("clerk_id").unique(),
  tier: text("tier").default("anonymous").notNull(), // 'anonymous' | 'free' | 'paid'
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const threads = pgTable("threads", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  model: text("model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id")
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertThreadSchema = createInsertSchema(threads);
export const insertMessageSchema = createInsertSchema(messages);

export type User = typeof users.$inferSelect;
export type ChatThread = typeof threads.$inferSelect;
export type ChatMessage = typeof messages.$inferSelect;
