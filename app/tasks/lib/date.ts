import type { TaskStatus } from "../../../lib/my-task-sync";

export function isOverdue(due: string | null, status: TaskStatus): boolean {
  if (!due || status !== "open") return false;
  return new Date(due) < new Date(new Date().toDateString());
}

export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayDateInputValue(): string {
  return toDateInputValue(new Date().toISOString());
}
