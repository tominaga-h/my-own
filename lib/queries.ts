import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "./db";
import { getAuthUser } from "./auth";
import { links, notes, projects, syncStates } from "../db/schema";

export async function getRecentNotes(limit = 5) {
  const userId = await getAuthUser();
  return db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.postedAt))
    .limit(limit);
}

export async function getRecentLinks(limit = 4) {
  const userId = await getAuthUser();
  return db
    .select()
    .from(links)
    .where(eq(links.userId, userId))
    .orderBy(desc(links.postedAt))
    .limit(limit);
}

export async function getCollectionStats() {
  const userId = await getAuthUser();
  const [notesResult, linksResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(notes)
      .where(eq(notes.userId, userId)),
    db
      .select({ count: count() })
      .from(links)
      .where(eq(links.userId, userId)),
  ]);
  return {
    notesCount: notesResult[0]?.count ?? 0,
    linksCount: linksResult[0]?.count ?? 0,
  };
}

export async function getLastSyncTime(): Promise<Date | null> {
  const userId = await getAuthUser();
  const row = await db
    .select({ updatedAt: syncStates.updatedAt })
    .from(syncStates)
    .where(and(eq(syncStates.userId, userId), eq(syncStates.key, "slack_last_ts")))
    .then((r) => r[0] ?? null);
  return row?.updatedAt ?? null;
}

export async function getProjectsWithCounts() {
  const userId = await getAuthUser();
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      notesCount: sql<number>`(select count(*) from notes where project_id = ${projects.id})`,
      linksCount: sql<number>`(select count(*) from links where project_id = ${projects.id})`,
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(projects.name);
  return rows;
}
