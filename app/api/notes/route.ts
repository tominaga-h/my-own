import { NextResponse } from "next/server";

import { createNote, listNotes } from "../../../lib/api-data";
import { requireApiUserId, toApiAuthResponse } from "../../../lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = requireApiUserId(request);
    const limitParam = new URL(request.url).searchParams.get("limit");
    const limit = Math.min(
      500,
      Math.max(1, Number.parseInt(limitParam ?? "200", 10) || 200),
    );
    const data = await listNotes(userId, limit);
    return NextResponse.json(data);
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const userId = requireApiUserId(request);
    const payload = (await request.json()) as { body?: string };
    const note = await createNote(userId, payload.body ?? "");
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof Error && error.message === "本文が空です") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
