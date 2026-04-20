import { NextResponse } from "next/server";

import { mtsListProjects } from "../../../lib/my-task-sync";
import { mapMtsErrorResponse } from "../../../lib/mts-error-response";
import { requireApiUserId, toApiAuthResponse } from "../../../lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireApiUserId(request);
    const data = await mtsListProjects();
    return NextResponse.json(data);
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    return mapMtsErrorResponse(error);
  }
}
