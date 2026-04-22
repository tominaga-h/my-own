export type LinkSearchRecord = {
  id: number;
  title: string;
  url: string;
  sourceLabel?: string;
  description: string;
};

export function filterLinksByQuery<T extends LinkSearchRecord>(
  records: T[],
  rawQuery: string,
): T[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return records;
  return records.filter((record) => {
    const haystack = [
      record.title,
      record.url,
      record.sourceLabel ?? "",
      record.description,
    ]
      .join("\n")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export type HighlightSegment =
  | { type: "text"; value: string }
  | { type: "match"; value: string };

export function buildHighlightSegments(
  text: string,
  rawQuery: string,
): HighlightSegment[] {
  const query = rawQuery.trim();
  if (!text) return [{ type: "text", value: text }];
  if (!query) return [{ type: "text", value: text }];

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, cursor);
    if (matchIndex === -1) {
      segments.push({ type: "text", value: text.slice(cursor) });
      break;
    }
    if (matchIndex > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, matchIndex) });
    }
    const matchEnd = matchIndex + query.length;
    segments.push({ type: "match", value: text.slice(matchIndex, matchEnd) });
    cursor = matchEnd;
  }

  return segments;
}

const ELLIPSIS = "…";

/**
 * Truncate text to `max` characters. When `query` is provided and appears in
 * the text, truncate around the first match so the match stays visible.
 * Pure string operation — safe for SSR and tests.
 */
export function truncateAroundMatch(
  text: string,
  max: number,
  rawQuery: string = "",
): string {
  if (text.length <= max) return text;

  const query = rawQuery.trim();
  if (!query) {
    return text.slice(0, Math.max(0, max - 1)) + ELLIPSIS;
  }

  const matchIndex = text.toLowerCase().indexOf(query.toLowerCase());
  if (matchIndex === -1) {
    return text.slice(0, Math.max(0, max - 1)) + ELLIPSIS;
  }

  if (matchIndex + query.length <= max - 1) {
    return text.slice(0, Math.max(0, max - 1)) + ELLIPSIS;
  }

  const budget = Math.max(0, max - 2);
  const contextBefore = Math.floor((budget - query.length) / 2);
  const start = Math.max(0, matchIndex - contextBefore);
  const end = Math.min(text.length, start + budget);
  const adjustedStart = Math.max(0, end - budget);
  const prefix = adjustedStart > 0 ? ELLIPSIS : "";
  const suffix = end < text.length ? ELLIPSIS : "";
  return prefix + text.slice(adjustedStart, end) + suffix;
}
