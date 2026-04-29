/**
 * isRead フラグで配列を未読/アーカイブ済みに振り分けるユーティリティ。
 * 元の並び順は保持する。
 */
export function partitionByRead<T extends { isRead: boolean }>(
  rows: T[],
): { unread: T[]; archived: T[] } {
  const unread: T[] = [];
  const archived: T[] = [];
  for (const r of rows) {
    if (r.isRead) {
      archived.push(r);
    } else {
      unread.push(r);
    }
  }
  return { unread, archived };
}
