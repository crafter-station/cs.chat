"use client";

import type { SourceUrlUIPart } from "ai";
import type { ComponentProps } from "react";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
} from "@/components/ai-elements/inline-citation";
import { parseCitationMarkers } from "@/lib/citations";

type CitationResponseProps = ComponentProps<typeof MessageResponse> & {
  sources: SourceUrlUIPart[];
};

export function CitationResponse({
  children,
  sources,
  mode,
  ...props
}: CitationResponseProps) {
  // During streaming or no sources: render plain MessageResponse
  if (mode === "streaming" || sources.length === 0) {
    return (
      <MessageResponse mode={mode} {...props}>
        {children}
      </MessageResponse>
    );
  }

  // Static mode with sources: parse citation markers and render inline pills
  const text = typeof children === "string" ? children : "";
  const segments = parseCitationMarkers(text, sources);

  // If parsing yielded no citations, render plain
  const hasCitations = segments.some((s) => s.type === "citation");
  if (!hasCitations) {
    return (
      <MessageResponse mode={mode} {...props}>
        {children}
      </MessageResponse>
    );
  }

  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === "text") {
          return (
            <MessageResponse key={i} mode="static" {...props}>
              {segment.content}
            </MessageResponse>
          );
        }

        // Citation pill
        const citedSources = segment.sourceIndices.map((idx) => sources[idx]);
        const urls = citedSources.map((s) => s.url);

        return (
          <InlineCitation key={i}>
            <InlineCitationCard>
              <InlineCitationCardTrigger sources={urls} />
              <InlineCitationCardBody>
                <InlineCitationCarousel>
                  <InlineCitationCarouselHeader>
                    <InlineCitationCarouselPrev />
                    <InlineCitationCarouselIndex />
                    <InlineCitationCarouselNext />
                  </InlineCitationCarouselHeader>
                  <InlineCitationCarouselContent>
                    {citedSources.map((source) => (
                      <InlineCitationCarouselItem key={source.sourceId}>
                        <InlineCitationSource
                          title={source.title ?? new URL(source.url).hostname}
                          url={source.url}
                        />
                      </InlineCitationCarouselItem>
                    ))}
                  </InlineCitationCarouselContent>
                </InlineCitationCarousel>
              </InlineCitationCardBody>
            </InlineCitationCard>
          </InlineCitation>
        );
      })}
    </>
  );
}
