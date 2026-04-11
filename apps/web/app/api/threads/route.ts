import { z } from "zod"
import {
  ensureThreadExists,
  fetchThreads,
} from "@/lib/thread-actions"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get("userId")
  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 })
  }
  const threads = await fetchThreads(userId)
  return Response.json({ threads })
}

const createSchema = z.object({
  id: z.string().min(1),
  model: z.string().min(1),
  userId: z.string().min(1),
})

export async function POST(req: Request) {
  let parsed
  try {
    parsed = createSchema.parse(await req.json())
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }
  await ensureThreadExists(parsed.id, parsed.model, parsed.userId)
  return Response.json({ ok: true })
}
