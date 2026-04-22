export type ViewMode = "card" | "compact";

export const DEFAULT_VIEW_MODE: ViewMode = "card";

export const VIEW_MODE_STORAGE_KEY = "my-own.links.viewMode";

/**
 * localStorage から読み取った未知の値を ViewMode に正規化する。
 * 不正値／null／undefined はすべて DEFAULT_VIEW_MODE にフォールバックする。
 */
export function parseViewMode(raw: string | null | undefined): ViewMode {
  if (raw === "card" || raw === "compact") {
    return raw;
  }
  return DEFAULT_VIEW_MODE;
}

/**
 * URL 文字列からホスト名のみを安全に抽出する。
 * パース失敗時は空文字を返し、呼び出し側のフォールバック描画を可能にする。
 */
export function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}
