import type { ReactNode } from "react";

import { buildHighlightSegments } from "./search";

export function highlightMatches(text: string, rawQuery: string): ReactNode {
  const segments = buildHighlightSegments(text, rawQuery);
  if (segments.length === 1 && segments[0].type === "text") {
    return segments[0].value;
  }
  return (
    <>
      {segments.map((segment, index) =>
        segment.type === "match" ? (
          <mark
            key={index}
            className="rounded bg-yellow-200 px-0.5 text-slate-900"
          >
            {segment.value}
          </mark>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </>
  );
}
