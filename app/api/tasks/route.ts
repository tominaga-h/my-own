import { NextResponse } from "next/server";

import { listTasks } from "../../../lib/api-data";
import { requireApiUserId, toApiAuthResponse } from "../../../lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = requireApiUserId(request);
    const data = await listTasks(userId);
    return NextResponse.json(data);
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }
}
