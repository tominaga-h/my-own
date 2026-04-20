const TASK_NUMBER_RE = /^\d+$/;

export function parseTaskNumber(value: string): number | null {
  if (!TASK_NUMBER_RE.test(value)) return null;
  const n = Number(value);
  if (n <= 0 || n > Number.MAX_SAFE_INTEGER) return null;
  return n;
}
