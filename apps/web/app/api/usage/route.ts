import { resolveUser } from "@/lib/user-service";
import { getUsage } from "@/lib/usage";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fingerprintId = searchParams.get("fingerprintId");

  if (!fingerprintId) {
    return Response.json({ error: "fingerprintId required" }, { status: 400 });
  }

  const user = await resolveUser(fingerprintId);
  const usage = await getUsage(user.id, user.tier);

  return Response.json({
    tier: user.tier,
    ...usage,
  });
}
