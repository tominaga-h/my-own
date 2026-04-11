import Database from "better-sqlite3";
import { db } from "./db";
import { projects, tasks, taskReminds } from "../db/schema";
import { sql } from "drizzle-orm";

type SqliteProject = {
  id: number;
  name: string;
};

type SqliteTask = {
  id: number;
  title: string;
  status: string;
  source: string;
  project_id: number | null;
  due: string | null;
  done_at: string | null;
  created: string;
  updated: string;
  important: number;
};

type SqliteRemind = {
  id: number;
  task_id: number;
  remind_at: string;
};

type MigrationResult = {
  projectsInserted: number;
  tasksInserted: number;
  remindsInserted: number;
};

function getUserId(): string {
  const userId = process.env.APP_USER_ID;
  if (!userId) throw new Error("APP_USER_ID is required");
  return userId;
}

function getSqlitePath(): string {
  const override = process.env.MY_TASK_DATA_FILE;
  if (override) return override;

  const home = process.env.HOME;
  if (!home) throw new Error("HOME is not set");
  return `${home}/Library/Application Support/my-task/tasks.db`;
}

/**
 * Migrate all data from my-task SQLite to Neon.
 * Preserves original IDs. Resets serial sequences after insert.
 * Safe to re-run: existing rows with same ID are skipped (ON CONFLICT DO NOTHING).
 */
export async function migrateMyTaskToNeon(): Promise<MigrationResult> {
  const userId = getUserId();
  const sqlitePath = getSqlitePath();
  const sqlite = new Database(sqlitePath, { readonly: true });

  try {
    // 1. Projects
    const sqliteProjects = sqlite
      .prepare("SELECT id, name FROM projects ORDER BY id")
      .all() as SqliteProject[];

    let projectsInserted = 0;
    for (const p of sqliteProjects) {
      const inserted = await db
        .insert(projects)
        .values({ id: p.id, userId, name: p.name })
        .onConflictDoNothing()
        .returning({ id: projects.id });
      projectsInserted += inserted.length;
    }

    // 2. Tasks
    const sqliteTasks = sqlite
      .prepare(
        "SELECT id, title, status, source, project_id, due, done_at, created, updated, important FROM tasks ORDER BY id",
      )
      .all() as SqliteTask[];

    let tasksInserted = 0;
    for (const t of sqliteTasks) {
      const inserted = await db
        .insert(tasks)
        .values({
          id: t.id,
          userId,
          title: t.title,
          status: t.status,
          source: t.source === "private" ? "cli" : t.source,
          projectId: t.project_id,
          important: t.important === 1,
          due: t.due || null,
          doneAt: t.done_at || null,
          createdAt: new Date(t.created),
          updatedAt: new Date(t.updated),
        })
        .onConflictDoNothing()
        .returning({ id: tasks.id });
      tasksInserted += inserted.length;
    }

    // 3. Task reminds
    const sqliteReminds = sqlite
      .prepare("SELECT id, task_id, remind_at FROM task_reminds ORDER BY id")
      .all() as SqliteRemind[];

    let remindsInserted = 0;
    for (const r of sqliteReminds) {
      const inserted = await db
        .insert(taskReminds)
        .values({
          id: r.id,
          taskId: r.task_id,
          remindAt: r.remind_at,
        })
        .onConflictDoNothing()
        .returning({ id: taskReminds.id });
      remindsInserted += inserted.length;
    }

    // 4. Reset serial sequences to max(id) + 1
    await db.execute(
      sql`SELECT setval('projects_id_seq', COALESCE((SELECT MAX(id) FROM projects), 0))`,
    );
    await db.execute(
      sql`SELECT setval('tasks_id_seq', COALESCE((SELECT MAX(id) FROM tasks), 0))`,
    );
    await db.execute(
      sql`SELECT setval('task_reminds_id_seq', COALESCE((SELECT MAX(id) FROM task_reminds), 0))`,
    );

    return { projectsInserted, tasksInserted, remindsInserted };
  } finally {
    sqlite.close();
  }
}
