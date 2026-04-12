import { NextResponse } from "next/server";
import { getMostLikelySelfDm } from "../../../../../lib/slack";
import { requireApiUserId, toApiAuthResponse } from "../../../../../lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireApiUserId(request);
    const data = await getMostLikelySelfDm();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
