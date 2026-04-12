import { desc, eq } from "drizzle-orm";

import { db } from "../../lib/db";
import { getAuthUser } from "../../lib/auth";
import { tasks, taskReminds, projects } from "../../db/schema";
import TasksView from "./TasksView";

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
    <main className="min-h-screen px-3 py-2 text-slate-800 sm:px-4 lg:px-5">
      <div className="mx-auto max-w-[1600px]">
        <TasksView rows={rows} remindsMap={remindsMap} projectMap={projectMap} />
      </div>
    </main>
  );
}
