import { NextResponse } from "next/server";
import { syncSlackSelfDmToDatabase } from "../../../../../lib/slack-sync";
import { requireApiUserId, toApiAuthResponse } from "../../../../../lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireApiUserId(request);
    const url = new URL(request.url);
    const daysParam = url.searchParams.get("days");
    const backfillDays = daysParam ? Number(daysParam) : undefined;
    const data = await syncSlackSelfDmToDatabase(
      Number.isFinite(backfillDays) ? { backfillDays } : {},
    );
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
