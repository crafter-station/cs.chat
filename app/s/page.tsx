"use client";

import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import { useUsage } from "@/hooks/use-usage";
import { Button } from "@/components/ui/button";
import { CrownIcon, SparklesIcon, UserIcon } from "lucide-react";
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
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPaid ? (
                <div className="flex size-9 items-center justify-center rounded-full bg-rose/15">
                  <CrownIcon className="size-4 text-rose" />
                </div>
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full bg-accent">
                  <SparklesIcon className="size-4 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {isPaid ? "Pro" : "Free"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPaid
                    ? "Unlimited messages, all models"
                    : `${usage?.limit ?? 0} messages/day`}
                </p>
              </div>
            </div>
            {isPaid ? (
              <Link href="/api/polar/portal">
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Link>
            ) : (
              <Link href="/pricing">
                <Button
                  size="sm"
                  className="bg-rose text-rose-foreground hover:bg-rose/90"
                >
                  Upgrade
                </Button>
              </Link>
            )}
          </div>

          {/* Usage bar for free users */}
          {!isPaid && usage && usage.limit !== null && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Today&apos;s usage</span>
                <span>
                  {usage.used} / {usage.limit}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                <div
                  className="h-full rounded-full bg-rose transition-all"
                  style={{
                    width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
