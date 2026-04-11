"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../lib/db";
import { getAuthUser } from "../../lib/auth";
import { notes } from "../../db/schema";

export async function createNote(body: string) {
  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "本文が空です" };
  }

  const userId = await getAuthUser();
  const [row] = await db
    .insert(notes)
    .values({
      userId,
      body: trimmed,
      source: "manual",
    })
    .returning();

  revalidatePath("/notes");
  revalidatePath("/");
  return { note: row };
}
