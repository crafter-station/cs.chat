"use client";

import {
  DefaultChatTransport,
  type ChatTransport,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { nanoid } from "nanoid";
import { models } from "@cs-chat/shared";
import { getLocalModelClient } from "./client";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

function uiMessageToText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();
}

function toChatMessages(messages: UIMessage[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant" && m.role !== "system") continue;
    const content = uiMessageToText(m);
    if (!content) continue;
    out.push({ role: m.role, content });
  }
  return out;
}

function localModelIdFor(id: string): string | null {
  const m = models.find((x) => x.id === id);
  if (!m?.isLocal) return null;
  return m.localModelId ?? null;
}

function createLocalStream(
  modelRepoId: string,
  messages: UIMessage[],
  abortSignal: AbortSignal | undefined,
): ReadableStream<UIMessageChunk> {
  const client = getLocalModelClient();
  const textId = nanoid();

  return new ReadableStream<UIMessageChunk>({
    async start(controller) {
      const enqueue = (chunk: UIMessageChunk) => {
        try {
          controller.enqueue(chunk);
        } catch {
          // controller may already be closed
        }
      };

      try {
        enqueue({ type: "start", messageId: nanoid() });
        enqueue({ type: "start-step" });

        // Load (cached after first use). Progress is surfaced via the
        // subscribable state in the client — see <LocalModelBanner/>.
        await client.load(modelRepoId);

        if (abortSignal?.aborted) {
          enqueue({ type: "abort", reason: "aborted" });
          controller.close();
          return;
        }

        enqueue({ type: "text-start", id: textId });

        await client.generate(
          toChatMessages(messages),
          (delta) => {
            enqueue({ type: "text-delta", id: textId, delta });
          },
          abortSignal,
        );

        enqueue({ type: "text-end", id: textId });
        enqueue({ type: "finish-step" });
        enqueue({ type: "finish", finishReason: "stop" });
        controller.close();
      } catch (err) {
        const isAbort = (err as Error).name === "AbortError";
        if (isAbort) {
          enqueue({ type: "abort", reason: "aborted" });
        } else {
          enqueue({
            type: "error",
            errorText: (err as Error).message ?? "Local model error",
          });
        }
        controller.close();
      }
    },
  });
}

export function createLocalAwareTransport(
  options?: ConstructorParameters<typeof DefaultChatTransport>[0],
): ChatTransport<UIMessage> {
  const remote = new DefaultChatTransport<UIMessage>(options);

  return {
    async sendMessages(opts) {
      const body = opts.body as { model?: string } | undefined;
      const localRepo = body?.model ? localModelIdFor(body.model) : null;
      if (localRepo) {
        return createLocalStream(localRepo, opts.messages, opts.abortSignal);
      }
      return remote.sendMessages(opts);
    },
    async reconnectToStream(opts) {
      return remote.reconnectToStream(opts);
    },
  };
}
