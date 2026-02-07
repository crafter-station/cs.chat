"use client";

import { useState, useEffect } from "react";
import { GithubLogo } from "@/components/logos/github";

export function GithubBadge() {
  const [githubStars, setGithubStars] = useState<number | null>(null);

  useEffect(() => {
    const fetchGithubStars = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/crafter-station/cs.chat",
        );
        if (response.ok) {
          const data = await response.json();
          setGithubStars(data.stargazers_count);
        }
      } catch (error) {
        console.warn("Failed to fetch GitHub stars:", error);
      }
    };
    fetchGithubStars();
  }, []);

  return (
    <a
      href="https://github.com/crafter-station/cs.chat"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 rounded-md border border-border/40 px-2 py-1 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
    >
      <GithubLogo className="size-3.5" />
      {githubStars !== null && (
        <span className="hidden items-center gap-1 text-xs sm:flex">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-yellow-500/60"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {githubStars}
        </span>
      )}
    </a>
  );
}
