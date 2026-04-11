import { generateText } from "ai";
import { ratelimit, getClientIdentifier } from "@/lib/ratelimit";

export const maxDuration = 15;

export async function POST(req: Request) {
  const { success, response } = await ratelimit(
    getClientIdentifier(req),
    "title",
  );
  if (!success) return response!;

  let body: { prompt: string; model: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { prompt, model } = body;

  const { text } = await generateText({
    model: model, 
    maxOutputTokens: 20,
    system:
      "Generate a concise title (6 words max) for a chat based on the user's message. Infer the likely topic of conversation. Return only the title, no quotes or punctuation.",
    prompt,
  });

  return Response.json({ title: text.trim() });
}

