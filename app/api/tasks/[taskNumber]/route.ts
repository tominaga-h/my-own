import { NextResponse } from "next/server";

import {
  mtsGetTask,
  mtsPatchTask,
  pickTaskPatch,
} from "../../../../lib/my-task-sync";
import { mapMtsErrorResponse } from "../../../../lib/mts-error-response";
import {
  requireApiUserId,
  toApiAuthResponse,
} from "../../../../lib/api-auth";
import { parseTaskNumber } from "../../../../lib/parse-task-number";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskNumber: string }> },
) {
  try {
    requireApiUserId(request);
    const { taskNumber } = await params;
    const n = parseTaskNumber(taskNumber);
    if (n === null) {
      return NextResponse.json({ error: "invalid taskNumber" }, { status: 400 });
    }
    const data = await mtsGetTask(n);
    return NextResponse.json(data);
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    return mapMtsErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskNumber: string }> },
) {
  try {
    requireApiUserId(request);
    const { taskNumber } = await params;
    const n = parseTaskNumber(taskNumber);
    if (n === null) {
      return NextResponse.json({ error: "invalid taskNumber" }, { status: 400 });
    }
    const raw = await request.json().catch(() => null);
    const body = pickTaskPatch(raw);
    const data = await mtsPatchTask(n, body);
    return NextResponse.json(data);
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    return mapMtsErrorResponse(error);
  }
}
