"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../lib/db";
import { notes } from "../../db/schema";

function getDatabaseUserId() {
  const userId = process.env.APP_USER_ID;
  if (!userId) {
    throw new Error("APP_USER_ID is required");
  }
  return userId;
}

export async function createNote(body: string) {
  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "本文が空です" };
  }

  const userId = getDatabaseUserId();
  const [row] = await db
    .insert(notes)
    .values({
      userId,
      body: trimmed,
      source: "manual",
    })
    .returning();

  revalidatePath("/notes");
  return { note: row };
}
