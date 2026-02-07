import { generateText } from "ai";
import { ratelimit, getClientIdentifier } from "@/lib/ratelimit";

export const maxDuration = 15;

export async function POST(req: Request) {
  const { success, response } = await ratelimit(
    getClientIdentifier(req),
    "title",
  );
  if (!success) return response!;

  const { prompt, model }: { prompt: string; model: string } =
    await req.json();

  const { text } = await generateText({
    model: model,
    maxOutputTokens: 20,
    system:
      "Generate a concise title (6 words max) for a chat that starts with the following message. Return only the title, no quotes or punctuation.",
    prompt,
  });

  return Response.json({ title: text.trim() });
}
