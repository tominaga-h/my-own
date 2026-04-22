import { NextResponse } from "next/server";

import {
  mtsDeleteProject,
  mtsUpdateProject,
  pickProjectBody,
} from "../../../../lib/my-task-sync";
import { mapMtsErrorResponse } from "../../../../lib/mts-error-response";
import {
  requireApiUserId,
  toApiAuthResponse,
} from "../../../../lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    requireApiUserId(request);
    const { id } = await ctx.params;
    const idNum = parseId(id);
    if (idNum === null) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }
    const raw = await request.json().catch(() => null);
    const body = pickProjectBody(raw);
    const data = await mtsUpdateProject(idNum, body);
    return NextResponse.json(data);
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    return mapMtsErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    requireApiUserId(request);
    const { id } = await ctx.params;
    const idNum = parseId(id);
    if (idNum === null) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }
    await mtsDeleteProject(idNum);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    return mapMtsErrorResponse(error);
  }
}
