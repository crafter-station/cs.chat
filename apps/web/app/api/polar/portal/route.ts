import { CustomerPortal } from "@polar-sh/nextjs";
import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  getExternalCustomerId: async (_req: NextRequest) => {
    const { userId } = await auth();
    return userId ?? "";
  },
  server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
});
