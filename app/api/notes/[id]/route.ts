import { NextResponse } from "next/server";

import { updateNote } from "../../../../lib/api-data";
import { requireApiUserId, toApiAuthResponse } from "../../../../lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = requireApiUserId(request);
    const { id } = await params;
    const noteId = Number.parseInt(id, 10);
    if (!Number.isFinite(noteId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const payload = (await request.json()) as { body?: string };
    const note = await updateNote(userId, noteId, payload.body ?? "");
    if (!note) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof Error && error.message === "本文が空です") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
