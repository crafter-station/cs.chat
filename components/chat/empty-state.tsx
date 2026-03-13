"use client";

import { CrafterStationLogo } from "@/components/logos/crafter-station";
import { GithubBadge } from "@/components/github-badge";
import { suggestions } from "@/lib/models";

interface EmptyStateProps {
  isTyping: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

export function EmptyState({ isTyping, onSuggestionClick }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center px-4 transition-all duration-300 ease-out ${
        isTyping
          ? "pointer-events-none -translate-y-4 scale-[0.98] opacity-0"
          : "translate-y-0 scale-100 opacity-100"
      }`}
    >
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
        How can I help you?
      </h1>

      <div className="w-full max-w-lg">
        {suggestions.map((suggestion, i) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className={`flex w-full items-center py-3.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground ${
              i < suggestions.length - 1 ? "border-b border-border" : ""
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <a
          href="https://crafterstation.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        >
          <CrafterStationLogo className="size-3.5" />
          <span className="text-xs">Crafter Station</span>
        </a>
        <span className="text-muted-foreground/20">|</span>
        <GithubBadge />
      </div>
    </div>
  );
}
