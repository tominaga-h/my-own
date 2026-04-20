import { NextResponse } from "next/server";

import {
  isRfc3339Datetime,
  isTaskStatus,
  mtsCreateTask,
  mtsListTasks,
  normalizeProjectParam,
  pickTaskCreate,
} from "../../../lib/my-task-sync";
import { mapMtsErrorResponse } from "../../../lib/mts-error-response";
import { requireApiUserId, toApiAuthResponse } from "../../../lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireApiUserId(request);
    const url = new URL(request.url);
    const sinceParam = url.searchParams.get("since");
    if (sinceParam !== null && !isRfc3339Datetime(sinceParam)) {
      return NextResponse.json(
        { error: "since must be RFC 3339 datetime" },
        { status: 400 },
      );
    }
    const statusParam = url.searchParams.get("status");
    if (statusParam !== null && !isTaskStatus(statusParam)) {
      return NextResponse.json(
        { error: "status must be open|done|closed" },
        { status: 400 },
      );
    }
    const projectParam = url.searchParams.get("project");
    let project: string | undefined;
    if (projectParam !== null) {
      const normalized = normalizeProjectParam(projectParam);
      if (normalized === null) {
        return NextResponse.json(
          { error: "project must be 1..200 chars after trim" },
          { status: 400 },
        );
      }
      project = normalized;
    }
    const data = await mtsListTasks({
      status: statusParam ?? undefined,
      since: sinceParam ?? undefined,
      project,
      limit: 500,
    });
    return NextResponse.json(data);
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    return mapMtsErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireApiUserId(request);
    const raw = await request.json().catch(() => null);
    const body = pickTaskCreate(raw);
    const data = await mtsCreateTask(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    return mapMtsErrorResponse(error);
  }
}
