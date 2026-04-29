"use client";

import LinksViewToggle from "./LinksViewToggle";
import type { ViewMode } from "../../lib/links/viewMode";

export type LinksView = "unread" | "archived";

type Props = {
  view: LinksView;
  onViewChange: (v: LinksView) => void;
  unreadCount: number;
  archivedCount: number;
  query: string;
  onQueryChange: (v: string) => void;
  onShuffle: () => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
};

const TABS: Array<{ key: LinksView; label: string }> = [
  { key: "unread", label: "未読" },
  { key: "archived", label: "アーカイブ済み" },
];

export default function LinksControlsBar({
  view,
  onViewChange,
  unreadCount,
  archivedCount,
  query,
  onQueryChange,
  onShuffle,
  viewMode,
  onViewModeChange,
}: Props) {
  const counts: Record<LinksView, number> = {
    unread: unreadCount,
    archived: archivedCount,
  };

  return (
    <div
      style={{
        borderRadius: 16,
        background: "rgba(255,255,255,.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "16px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {TABS.map((t) => {
            const on = t.key === view;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onViewChange(t.key)}
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  background: on
                    ? "linear-gradient(90deg,#3525cd,#4f46e5)"
                    : "transparent",
                  color: on ? "#fff" : "#464555",
                  boxShadow: on ? "0 2px 8px rgba(53,37,205,.18)" : "none",
                }}
              >
                {t.label}
                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6 }}>
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{ height: 24, width: 1, background: "rgba(230,232,234,.8)" }}
        />

        {/* Search */}
        <div
          style={{
            flex: 1,
            minWidth: 240,
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 12,
            background: "rgba(255,255,255,.8)",
            padding: "6px 12px",
            boxShadow: "inset 0 0 0 1px rgba(230,232,234,.6)",
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "rgba(70,69,85,.35)", flexShrink: 0 }}
            aria-hidden="true"
          >
            <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="タイトル / URL / description を検索"
            aria-label="リンクを検索"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
              color: "#191c1e",
              fontFamily: "inherit",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "rgba(70,69,85,.45)",
                fontSize: 11,
                fontFamily: "inherit",
              }}
            >
              クリア
            </button>
          )}
        </div>

        {/* Random button */}
        <button
          type="button"
          onClick={onShuffle}
          aria-label="リンクをランダムに並べ替え"
          className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          ランダム
        </button>

        {/* View mode toggle */}
        <LinksViewToggle value={viewMode} onChange={onViewModeChange} />
      </div>
    </div>
  );
}
