import { streamText, UIMessage, convertToModelMessages } from "ai";
import { ratelimit, getClientIdentifier } from "@/lib/ratelimit";
import { resolveUser } from "@/lib/user-service";
import { incrementUsage } from "@/lib/usage";

export const maxDuration = 30;

export async function POST(req: Request) {
  // Per-second rate limit (unchanged)
  const { success, response } = await ratelimit(
    getClientIdentifier(req),
    "chat",
  );
  if (!success) return response!;

  let body: { messages: UIMessage[]; model: string; fingerprintId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { model, messages, fingerprintId } = body;

  // Daily usage limit
  if (fingerprintId) {
    const user = await resolveUser(fingerprintId);
    const allowed = await incrementUsage(user.id, user.tier);
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: "Daily message limit reached. Sign up for more messages.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  const result = streamText({
    model: model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    sendSources: true,
  });
}
