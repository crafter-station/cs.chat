"use client";

import { Shimmer } from "@/components/ai-elements/shimmer";
import type { ChatThread } from "@/db/schema";

interface ThreadTitleProps {
  activeThread: ChatThread | undefined;
}

export function ThreadTitle({ activeThread }: ThreadTitleProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 z-20 hidden justify-center sm:flex">
      <div className="pointer-events-auto rounded-full bg-background/60 px-4 py-1 text-sm font-medium backdrop-blur-md">
        {activeThread ? (
          activeThread.title === null ? (
            <Shimmer as="span" duration={1.5}>
              New chat
            </Shimmer>
          ) : (
            activeThread.title
          )
        ) : (
          "C3.chat"
        )}
      </div>
    </div>
  );
}
