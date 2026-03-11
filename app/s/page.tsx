"use client";

import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import { useUsage } from "@/hooks/use-usage";
import { Button } from "@/components/ui/button";
import { CrownIcon, UserIcon, ZapIcon } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { data: usage } = useUsage();

  const isPaid = usage?.tier === "paid";

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-8 p-6 pt-16">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      {/* Account */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Account</h2>
        <div className="rounded-xl border border-border p-4">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-accent">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt=""
                    className="size-9 rounded-full"
                  />
                ) : (
                  <UserIcon className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user?.fullName || "User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Sign in to sync your data
              </p>
              <SignInButton mode="modal">
                <Button variant="outline" size="sm">
                  Sign in
                </Button>
              </SignInButton>
            </div>
          )}
        </div>
      </section>

      {/* Subscription */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Subscription
        </h2>
        {isPaid ? (
          <div className="rounded-xl border border-rose/30 bg-rose/5 p-5">
            <div className="flex items-center gap-2.5">
              <CrownIcon className="size-4 text-rose" />
              <span className="text-sm font-semibold">Pro Plan</span>
              <span className="ml-auto text-sm font-medium text-muted-foreground">
                $10/mo
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Unlimited messages with all 13+ AI models.
            </p>
            <Link href="/api/polar/portal" className="mt-4 block">
              <Button variant="outline" size="sm" className="w-full">
                Manage subscription
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-border p-5">
              <div className="flex items-center gap-2.5">
                <ZapIcon className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Free Plan</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {usage?.limit ?? 0} messages/day
                </span>
              </div>

              {usage && usage.limit !== null && (
                <div className="mt-4 space-y-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-rose transition-all"
                      style={{
                        width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {usage.remaining} of {usage.limit} messages remaining today
                  </p>
                </div>
              )}
            </div>

            <Link href="/pricing" className="block">
              <Button className="w-full bg-rose text-rose-foreground hover:bg-rose/90">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
