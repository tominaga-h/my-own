import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "./db";
import { mtsListTasks } from "./my-task-sync";
import { links, notes, projects, syncStates } from "../db/schema";

export async function getCollectionStats(userId: string) {
  const [notesResult, linksResult, syncRow] = await Promise.all([
    db
      .select({ count: count() })
      .from(notes)
      .where(eq(notes.userId, userId)),
    db
      .select({ count: count() })
      .from(links)
      .where(eq(links.userId, userId)),
    db
      .select({ updatedAt: syncStates.updatedAt })
      .from(syncStates)
      .where(and(eq(syncStates.userId, userId), eq(syncStates.key, "slack_last_ts")))
      .then((rows) => rows[0] ?? null),
  ]);

  return {
    notesCount: notesResult[0]?.count ?? 0,
    linksCount: linksResult[0]?.count ?? 0,
    lastSyncAt: syncRow?.updatedAt ?? null,
  };
}

export async function getRecentCollections(userId: string) {
  const [recentNotes, recentLinks] = await Promise.all([
    db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.postedAt))
      .limit(5),
    db
      .select()
      .from(links)
      .where(eq(links.userId, userId))
      .orderBy(desc(links.postedAt))
      .limit(4),
  ]);

  return { recentNotes, recentLinks };
}

export async function getProjectsWithCounts(userId: string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      notesCount: sql<number>`(select count(*) from notes where project_id = ${projects.id})`,
      linksCount: sql<number>`(select count(*) from links where project_id = ${projects.id})`,
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(projects.name);
}

export async function listNotes(userId: string, limit = 200) {
  const [notesRows, syncRow] = await Promise.all([
    db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.postedAt))
      .limit(limit),
    db
      .select({ updatedAt: syncStates.updatedAt })
      .from(syncStates)
      .where(and(eq(syncStates.userId, userId), eq(syncStates.key, "slack_last_ts")))
      .then((rows) => rows[0] ?? null),
  ]);

  return {
    notes: notesRows,
    lastSyncAt: syncRow?.updatedAt ?? null,
  };
}

export async function createNote(userId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("本文が空です");
  }

  const [row] = await db
    .insert(notes)
    .values({
      userId,
      body: trimmed,
      source: "manual",
    })
    .returning();

  return row;
}

export async function updateNote(userId: string, id: number, body: string) {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("本文が空です");
  }

  const [row] = await db
    .update(notes)
    .set({ body: trimmed, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();

  return row ?? null;
}

export async function listTasks(_userId: string) {
  const res = await mtsListTasks({ limit: 500 });
  return { tasks: res.tasks, serverTime: res.serverTime };
}

export async function listLinks(userId: string, limit = 100) {
  const [rows, syncRow] = await Promise.all([
    db
      .select()
      .from(links)
      .where(eq(links.userId, userId))
      .orderBy(desc(links.postedAt))
      .limit(limit),
    db
      .select({ updatedAt: syncStates.updatedAt })
      .from(syncStates)
      .where(and(eq(syncStates.userId, userId), eq(syncStates.key, "slack_last_ts")))
      .then((rows) => rows[0] ?? null),
  ]);

  return {
    links: rows,
    lastSyncAt: syncRow?.updatedAt ?? null,
  };
}

export async function markLinkRead(userId: string, id: number) {
  const [row] = await db
    .update(links)
    .set({ readAt: new Date(), updatedAt: new Date() })
    .where(and(eq(links.id, id), eq(links.userId, userId)))
    .returning();

  return row ?? null;
}

export async function markLinkUnread(userId: string, id: number) {
  const [row] = await db
    .update(links)
    .set({ readAt: null, updatedAt: new Date() })
    .where(and(eq(links.id, id), eq(links.userId, userId)))
    .returning();

  return row ?? null;
}
