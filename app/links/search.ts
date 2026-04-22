export type LinkSearchRecord = {
  id: number;
  title: string;
  url: string;
  description: string;
};

export function filterLinksByQuery<T extends LinkSearchRecord>(
  records: T[],
  rawQuery: string,
): T[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return records;
  return records.filter((record) => {
    const haystack = `${record.title}\n${record.url}\n${record.description}`.toLowerCase();
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
