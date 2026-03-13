"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2Icon, ExternalLinkIcon, LoaderIcon } from "lucide-react";

const BUG_CATEGORIES = [
  { value: "ui", label: "UI / Visual" },
  { value: "chat", label: "Chat / Messages" },
  { value: "auth", label: "Login / Account" },
  { value: "performance", label: "Performance" },
  { value: "other", label: "Other" },
] as const;

type Status = "idle" | "submitting" | "success" | "error";

interface BugReportDialogProps {
  children: React.ReactNode;
}

export function BugReportDialog({ children }: BugReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [issueUrl, setIssueUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit =
    title.trim().length > 0 && description.trim().length > 0 && status !== "submitting";

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setDescription("");
    setSteps("");
    setStatus("idle");
    setIssueUrl(null);
    setErrorMsg("");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const handleSubmit = async () => {
    setStatus("submitting");
    setErrorMsg("");

    const body = [
      `**Category:** ${category || "Not specified"}`,
      "",
      "## Description",
      description.trim(),
      ...(steps.trim() ? ["", "## Steps to Reproduce", steps.trim()] : []),
      "",
      "---",
      `*Reported via [C3.chat](https://cs.chat) bug reporter*`,
    ].join("\n");

    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit report");
      }

      const { url } = (await res.json()) as { url: string };
      setIssueUrl(url);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="overflow-hidden border-border/50 bg-gradient-to-b from-background to-muted/30 shadow-xl backdrop-blur-xl dark:from-[oklch(0.18_0_0)] dark:to-[oklch(0.15_0_0)] sm:max-w-md">
        {status === "success" ? (
          <>
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <CheckCircle2Icon className="size-7 text-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <DialogTitle className="text-lg">Bug reported!</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Thanks for helping us improve C3.chat.
                </p>
              </div>
              {issueUrl && (
                <a
                  href={issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose/10 px-3.5 py-1.5 text-sm font-medium text-rose ring-1 ring-rose/20 transition-colors hover:bg-rose/15"
                >
                  View on GitHub
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => handleOpenChange(false)}
                variant="outline"
                className="w-full text-sm"
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report a Bug</DialogTitle>
              <DialogDescription>
                Describe the issue and we&apos;ll track it on GitHub.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <Input
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={status === "submitting"}
                className="bg-background/60 dark:bg-white/5"
              />

              <div className="flex flex-wrap gap-1.5">
                {BUG_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    disabled={status === "submitting"}
                    onClick={() =>
                      setCategory(category === cat.value ? "" : cat.value)
                    }
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                      category === cat.value
                        ? "border-rose/40 bg-rose/10 text-rose shadow-sm shadow-rose/10"
                        : "border-border/60 text-muted-foreground hover:border-foreground/20 hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="What happened? What did you expect?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={status === "submitting"}
                rows={3}
                className="bg-background/60 dark:bg-white/5"
              />

              <Textarea
                placeholder="Steps to reproduce (optional)"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                disabled={status === "submitting"}
                rows={2}
                className="bg-background/60 dark:bg-white/5"
              />

              {status === "error" && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMsg}
                </p>
              )}
            </div>

            <DialogFooter className="pt-1">
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={status === "submitting"}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-rose text-rose-foreground shadow-sm shadow-rose/20 hover:bg-rose/90 text-sm"
              >
                {status === "submitting" ? (
                  <>
                    <LoaderIcon className="size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
