import { NextResponse } from "next/server";

import { listLinks } from "../../../lib/api-data";
import { requireApiUserId, toApiAuthResponse } from "../../../lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = requireApiUserId(request);
    const limitParam = new URL(request.url).searchParams.get("limit");
    const limit = Math.min(
      500,
      Math.max(1, Number.parseInt(limitParam ?? "100", 10) || 100),
    );
    const data = await listLinks(userId, limit);
    return NextResponse.json(data);
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }
}
