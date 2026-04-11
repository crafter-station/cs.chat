"use client";

import type { SourceUrlUIPart } from "ai";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";

interface MessageSourcesProps {
  sources: SourceUrlUIPart[];
}

export function MessageSources({ sources }: MessageSourcesProps) {
  if (sources.length === 0) return null;

  return (
    <Sources>
      <SourcesTrigger count={sources.length} />
      <SourcesContent>
        {sources.map((s) => (
          <Source
            key={s.sourceId}
            href={s.url}
            title={s.title ?? new URL(s.url).hostname}
          />
        ))}
      </SourcesContent>
    </Sources>
  );
}
