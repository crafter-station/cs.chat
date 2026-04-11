"use client";

import { SignInButton } from "@clerk/nextjs";
import { useUsage } from "@/hooks/use-usage";
import Link from "next/link";

export function UsageBanner() {
  const { data } = useUsage();

  if (!data || data.tier === "paid") return null;

  const blocked = !data.canSend;

  // Anonymous users
  if (data.tier === "anonymous") {
    if (data.used < 2) return null;

    return (
      <div
        className={`pointer-events-auto mb-2 rounded-lg px-3 py-2 text-center text-xs transition-colors ${
          blocked ? "bg-rose/15 text-rose" : "text-muted-foreground"
        }`}
      >
        {blocked ? (
          <>
            Daily limit reached.{" "}
            <SignInButton mode="modal">
              <button className="font-medium underline underline-offset-2 hover:text-foreground">
                Sign up to continue chatting
              </button>
            </SignInButton>
          </>
        ) : (
          <>
            {data.remaining} of {data.limit} free messages remaining today.{" "}
            <SignInButton mode="modal">
              <button className="font-medium underline underline-offset-2 hover:text-foreground">
                Sign up for 50/day
              </button>
            </SignInButton>
          </>
        )}
      </div>
    );
  }

  // Free tier users
  if (data.tier === "free") {
    if (!blocked && data.used < 10) return null;

    return (
      <div
        className={`pointer-events-auto mb-2 rounded-lg px-3 py-2 text-center text-xs transition-colors ${
          blocked ? "bg-rose/15 text-rose" : "text-muted-foreground"
        }`}
      >
        {blocked ? (
          <>
            Daily limit reached.{" "}
            <Link
              href="/pricing"
              className="font-medium underline underline-offset-2 hover:text-foreground"
            >
              Upgrade to Pro for unlimited
            </Link>
          </>
        ) : (
          <>
            {data.remaining} of {data.limit} messages remaining today.{" "}
            <Link
              href="/pricing"
              className="font-medium underline underline-offset-2 hover:text-foreground"
            >
              Upgrade to Pro
            </Link>
          </>
        )}
      </div>
    );
  }

  return null;
}
