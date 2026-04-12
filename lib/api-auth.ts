import { NextResponse } from "next/server";

export class ApiAuthError extends Error {
  status = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "ApiAuthError";
  }
}

export function requireApiUserId(request: Request): string {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is required");
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${apiKey}`) {
    throw new ApiAuthError();
  }

  const userId = process.env.APP_USER_ID;
  if (!userId) {
    throw new Error("APP_USER_ID is required");
  }

  return userId;
}

export function toApiAuthResponse(error: unknown) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return null;
}
