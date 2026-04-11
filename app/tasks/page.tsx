import { desc, eq } from "drizzle-orm";

import { db } from "../../lib/db";
import { getAuthUser } from "../../lib/auth";
import { tasks, taskReminds, projects } from "../../db/schema";
import TasksView from "./TasksView";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const databaseUserId = await getAuthUser();

  const [rows, reminds, projectRows] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, databaseUserId))
      .orderBy(desc(tasks.createdAt))
      .limit(500),
    db.select().from(taskReminds),
    db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.userId, databaseUserId)),
  ]);

  const remindsMap: Record<number, string[]> = {};
  for (const r of reminds) {
    (remindsMap[r.taskId] ??= []).push(r.remindAt);
  }

  const projectMap: Record<number, string> = {};
  for (const p of projectRows) {
    projectMap[p.id] = p.name;
  }

  return (
    <main className="min-h-screen px-3 py-3 text-slate-800 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 py-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            My Tasks
          </h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500">
            {rows.length} tasks
          </span>
        </div>

        <TasksView rows={rows} remindsMap={remindsMap} projectMap={projectMap} />
      </div>
    </main>
  );
}
