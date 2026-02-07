import type { SourceUrlUIPart } from "ai";

export type CitationSegment =
  | { type: "text"; content: string }
  | { type: "citation"; sourceIndices: number[] };

/**
 * Parse text containing `[n]` or `[n,m]` citation markers into segments.
 * Returns interleaved text and citation segments.
 */
export function parseCitationMarkers(
  text: string,
  sources: SourceUrlUIPart[],
): CitationSegment[] {
  if (sources.length === 0) return [{ type: "text", content: text }];

  // Match [1], [2], or grouped like [1,2] or [1, 2]
  const markerPattern = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
  const segments: CitationSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(markerPattern)) {
    const indices = match[1]
      .split(",")
      .map((s) => parseInt(s.trim(), 10) - 1) // Convert 1-based to 0-based
      .filter((i) => i >= 0 && i < sources.length);

    // Skip markers that don't reference valid sources
    if (indices.length === 0) continue;

    // Add preceding text
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    segments.push({ type: "citation", sourceIndices: indices });
    lastIndex = match.index + match[0].length;
  }

  // Add trailing text
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", content: text }];
}
