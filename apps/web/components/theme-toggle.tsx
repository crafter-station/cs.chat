"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/theme-store";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { startTransition, endTransition } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      const x = event.clientX;
      const y = event.clientY;
      const newTheme = theme === "light" ? "dark" : "light";

      if (
        !document.startViewTransition ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setTheme(newTheme);
        return;
      }

      startTransition(x, y);

      const transition = document.startViewTransition(() => {
        setTheme(newTheme);
      });

      try {
        await transition.ready;

        const maxRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 500,
            easing: "ease-out",
            pseudoElement: "::view-transition-new(root)",
          }
        );

        await transition.finished;
      } finally {
        endTransition();
      }
    },
    [theme, setTheme, startTransition, endTransition]
  );

  if (!mounted) {
    return (
      <div className={cn("flex items-center", className)}>
        <div className="h-6 w-11 animate-pulse rounded-full bg-input" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className={cn("flex items-center", className)}>
      <button
        type="button"
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
          isDark ? "bg-foreground/20" : "bg-muted"
        }`}
      >
        <span className="sr-only">Toggle theme</span>
        <span
          className={`inline-flex size-4 items-center justify-center rounded-full bg-background transition duration-200 ease-in-out ${
            isDark ? "translate-x-6" : "translate-x-1"
          }`}
        >
          {isDark ? (
            <MoonIcon className="size-2.5 text-foreground" />
          ) : (
            <SunIcon className="size-2.5 text-foreground" />
          )}
        </span>
      </button>
    </div>
  );
}
