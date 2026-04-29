import { NextResponse } from "next/server";

import { markLinkRead, markLinkUnread } from "../../../../../lib/api-data";
import {
  requireApiUserId,
  toApiAuthResponse,
} from "../../../../../lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = requireApiUserId(request);
    const { id } = await params;
    const linkId = Number.parseInt(id, 10);
    if (!Number.isFinite(linkId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const link = await markLinkRead(userId, linkId);
    if (!link) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ link });
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = requireApiUserId(request);
    const { id } = await params;
    const linkId = Number.parseInt(id, 10);
    if (!Number.isFinite(linkId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const link = await markLinkUnread(userId, linkId);
    if (!link) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ link });
  } catch (error) {
    const authResponse = toApiAuthResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }
}
