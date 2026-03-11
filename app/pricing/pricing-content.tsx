"use client";

import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import { useUsage } from "@/hooks/use-usage";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const POLAR_PRO_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID;

const FREE_FEATURES = [
  "5 messages/day (guest)",
  "50 messages/day (signed in)",
  "GPT-4o Mini, Gemini Flash, Llama 3.3",
  "DeepSeek R1 & V3",
  "Basic conversation threads",
];

const PRO_FEATURES = [
  "Unlimited messages",
  "All 13+ models",
  "Claude Opus 4, GPT-4o, Grok 3",
  "Sonar Pro, Gemini 1.5 Pro",
  "Mistral Large",
  "Priority access",
];

export function PricingContent() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const { data: usage } = useUsage();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";

  const isPaid = usage?.tier === "paid";

  if (success) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 text-4xl">
            &#10003;
          </div>
          <h1 className="mb-2 text-2xl font-semibold">
            Welcome to Pro!
          </h1>
          <p className="mb-6 text-muted-foreground">
            You now have unlimited access to all AI models. Your account will be
            upgraded shortly.
          </p>
          <Link href="/">
            <Button>Start chatting</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          Simple pricing
        </h1>
        <p className="mb-10 text-muted-foreground">
          One chat, every AI model. Upgrade for unlimited access.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Free tier */}
          <div className="rounded-xl border border-border p-6 text-left">
            <h2 className="mb-1 text-lg font-semibold">Free</h2>
            <div className="mb-4">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Get started with popular open-source and lightweight models.
            </p>
            <ul className="mb-6 space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {f}
                </li>
              ))}
            </ul>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full">
                  Sign up free
                </Button>
              </SignInButton>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                {isPaid ? "Included" : "Current plan"}
              </Button>
            )}
          </div>

          {/* Pro tier */}
          <div className="rounded-xl border-2 border-foreground p-6 text-left">
            <h2 className="mb-1 text-lg font-semibold">Pro</h2>
            <div className="mb-4">
              <span className="text-3xl font-bold">$10</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Unlimited messages with every model, including premium ones.
            </p>
            <ul className="mb-6 space-y-2.5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckIcon className="mt-0.5 size-4 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {isPaid ? (
              <Link href="/api/polar/portal">
                <Button className="w-full">Manage subscription</Button>
              </Link>
            ) : isSignedIn ? (
              <Link
                href={`/api/polar/checkout?products=${POLAR_PRO_PRODUCT_ID}&customerExternalId=${userId}&customerEmail=${encodeURIComponent(user?.primaryEmailAddress?.emailAddress ?? "")}&customerName=${encodeURIComponent(user?.fullName ?? "")}`}
              >
                <Button className="w-full">Upgrade to Pro</Button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <Button className="w-full">Sign up to upgrade</Button>
              </SignInButton>
            )}
          </div>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Powered by Polar. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
