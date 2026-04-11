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
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-rose/15 text-rose mx-auto">
            <CheckIcon className="size-6" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold">
            Welcome to Pro!
          </h1>
          <p className="mb-6 text-muted-foreground">
            You now have unlimited access to all AI models. Your account will be
            upgraded shortly.
          </p>
          <Link href="/">
            <Button className="bg-rose text-rose-foreground hover:bg-rose/90">Start chatting</Button>
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
          <div className="relative rounded-xl border-2 border-rose p-6 text-left">
            <span className="absolute -top-3 left-4 rounded-full bg-rose px-3 py-0.5 text-xs font-medium text-rose-foreground">
              Popular
            </span>
            <h2 className="mb-1 text-lg font-semibold">Pro</h2>
            <div className="mb-4">
              <span className="text-3xl font-bold">$6</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Unlimited messages with every model, including premium ones.
            </p>
            <ul className="mb-6 space-y-2.5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-rose" />
                  {f}
                </li>
              ))}
            </ul>
            {isPaid ? (
              <Link href="/api/polar/portal">
                <Button className="w-full bg-rose text-rose-foreground hover:bg-rose/90">Manage subscription</Button>
              </Link>
            ) : isSignedIn ? (
              <Link
                href={`https://buy.polar.sh/polar_cl_Hjw0Si2OUPimpeh7eFXm38wOPAxxGntGx4WFI3QS8A9?customerExternalId=${userId}&customerEmail=${encodeURIComponent(user?.primaryEmailAddress?.emailAddress ?? "")}&customerName=${encodeURIComponent(user?.fullName ?? "")}`}
              >
                <Button className="w-full bg-rose text-rose-foreground hover:bg-rose/90">Upgrade to Pro</Button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <Button className="w-full bg-rose text-rose-foreground hover:bg-rose/90">Sign up to upgrade</Button>
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
