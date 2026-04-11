import { z } from "zod"
import {
  deleteThreadAction,
  updateThreadModelAction,
  updateThreadTitleAction,
} from "@/lib/thread-actions"

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let parsed
  try {
    parsed = patchSchema.parse(await req.json())
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }
  if (parsed.title !== undefined) {
    await updateThreadTitleAction(id, parsed.title)
  }
  if (parsed.model !== undefined) {
    await updateThreadModelAction(id, parsed.model)
  }
  return Response.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await deleteThreadAction(id)
  return Response.json({ ok: true })
}
