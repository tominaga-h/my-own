import type { TaskDto } from "../../../lib/my-task-sync";
import { isOverdue } from "./date";

export type StatusFilter = "open" | "done" | "closed" | "all";

export type Bucket = {
  key: string;
  label: string;
  tone: string;
  rows: TaskDto[];
};

export function groupTasks(
  rows: TaskDto[],
  filter: StatusFilter,
): Bucket[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const within1Day = (iso: string | null) => {
    if (!iso) return false;
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    const diff = (d.getTime() - today.getTime()) / 86400000;
    return diff < 1 && diff >= 0;
  };
  const buckets: Record<string, Bucket> = {
    overdue: { key: "overdue", label: "Overdue", tone: "#ef4444", rows: [] },
    today: { key: "today", label: "Today", tone: "#3525cd", rows: [] },
    upcoming: { key: "upcoming", label: "Upcoming", tone: "#6366f1", rows: [] },
    nodue: {
      key: "nodue",
      label: "No due",
      tone: "rgba(70,69,85,.5)",
      rows: [],
    },
    done: { key: "done", label: "Done", tone: "#60a5fa", rows: [] },
    closed: {
      key: "closed",
      label: "Closed",
      tone: "rgba(70,69,85,.4)",
      rows: [],
    },
  };

  if (filter === "open") {
    for (const r of rows) {
      if (r.status !== "open") {
        buckets[r.status === "done" ? "done" : "closed"].rows.push(r);
        continue;
      }
      if (isOverdue(r.due, r.status)) buckets.overdue.rows.push(r);
      else if (within1Day(r.due)) buckets.today.rows.push(r);
      else if (r.due) buckets.upcoming.rows.push(r);
      else buckets.nodue.rows.push(r);
    }
    return [
      buckets.overdue,
      buckets.today,
      buckets.upcoming,
      buckets.nodue,
    ].filter((b) => b.rows.length > 0);
  }

  if (filter === "all") {
    for (const r of rows) {
      if (r.status === "closed") buckets.closed.rows.push(r);
      else if (r.status === "done") buckets.done.rows.push(r);
      else if (isOverdue(r.due, r.status)) buckets.overdue.rows.push(r);
      else if (within1Day(r.due)) buckets.today.rows.push(r);
      else if (r.due) buckets.upcoming.rows.push(r);
      else buckets.nodue.rows.push(r);
    }
    return [
      buckets.overdue,
      buckets.today,
      buckets.upcoming,
      buckets.nodue,
      buckets.done,
      buckets.closed,
    ].filter((b) => b.rows.length > 0);
  }

  return [
    {
      key: filter,
      label: filter === "done" ? "Done" : "Closed",
      tone: filter === "done" ? "#60a5fa" : "rgba(70,69,85,.4)",
      rows,
    },
  ];
}
