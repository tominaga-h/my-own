import { NextRequest, NextResponse } from "next/server";
import { syncSlackSelfDmToDatabase } from "../../../lib/slack-sync";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  // Slack sync
  try {
    results.slack = await syncSlackSelfDmToDatabase();
  } catch (e) {
    errors.slack = e instanceof Error ? e.message : String(e);
  }

  // 将来のサービス同期はここに追加

  const hasErrors = Object.keys(errors).length > 0;

  return NextResponse.json(
    { ok: !hasErrors, results, errors },
    { status: hasErrors ? 207 : 200 },
  );
}
