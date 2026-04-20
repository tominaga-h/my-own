import { NextResponse } from "next/server";

import { isMtsError, MtsValidationError } from "./my-task-sync";

export function mapMtsErrorResponse(error: unknown): NextResponse {
  if (error instanceof MtsValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (isMtsError(error)) {
    // upstream の生エラー文字列はクライアントに返さない:
    //   - 4xx は my-task-sync 由来の検証メッセージなのでそのまま伝える
    //   - 5xx は内部実装の漏洩を避け generic なメッセージに置換
    if (error.status >= 400 && error.status < 500) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    return NextResponse.json(
      { error: "my-task-sync upstream error" },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { error: "my-task-sync unreachable" },
    { status: 502 },
  );
}
