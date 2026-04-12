import { NextResponse } from "next/server";
import { migrateMyTaskToNeon } from "../../../../lib/task-migration";
import { requireApiUserId, toApiAuthResponse } from "../../../../lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireApiUserId(request);
    const result = await migrateMyTaskToNeon();
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
