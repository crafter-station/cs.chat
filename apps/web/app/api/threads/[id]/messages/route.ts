import { z } from "zod"
import type { UIMessage } from "ai"
import { fetchMessages, saveMessagesAction } from "@/lib/thread-actions"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const messages = await fetchMessages(id)
  return Response.json({ messages })
}

const saveSchema = z.object({
  messages: z.array(z.unknown()),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let parsed
  try {
    parsed = saveSchema.parse(await req.json())
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }
  await saveMessagesAction(id, parsed.messages as UIMessage[])
  return Response.json({ ok: true })
}
