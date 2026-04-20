import { ApiError } from "../../../lib/api-client";

export function formatApiError(e: unknown, verb = "操作"): string {
  if (e instanceof ApiError) {
    if (e.status === 400) return "入力内容を確認してください";
    if (e.status === 401 || e.status === 403) return "認証エラー";
    if (e.status === 502) return "my-task-sync に到達できません";
    return `${verb}に失敗しました (HTTP ${e.status})`;
  }
  return `${verb}に失敗しました`;
}
