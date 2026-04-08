import { NextResponse } from "next/server";
import { syncSlackSelfDmToDatabase } from "../../../../../lib/slack-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const daysParam = url.searchParams.get("days");
    const backfillDays = daysParam ? Number(daysParam) : undefined;
    const data = await syncSlackSelfDmToDatabase(
      Number.isFinite(backfillDays) ? { backfillDays } : {},
    );
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
