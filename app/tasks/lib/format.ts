export function fmtShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtFull(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

export function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return "今";
  if (diff < 60) return `${Math.round(diff)}分前`;
  if (diff < 60 * 24) return `${Math.round(diff / 60)}時間前`;
  return `${Math.round(diff / 60 / 24)}日前`;
}
