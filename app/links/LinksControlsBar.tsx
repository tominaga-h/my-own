"use client";

import { CHEVRON_DATA_URL } from "../tasks/lib/chevron";
import LinksViewToggle from "./LinksViewToggle";
import type { ViewMode } from "../../lib/links/viewMode";

export type LinksView = "unread" | "archived";
export type LinksSortOrder = "newest" | "oldest" | "random";

type Props = {
  view: LinksView;
  onViewChange: (v: LinksView) => void;
  unreadCount: number;
  archivedCount: number;
  query: string;
  onQueryChange: (v: string) => void;
  sortOrder: LinksSortOrder;
  onSortOrderChange: (v: LinksSortOrder) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
};

const TABS: Array<{ key: LinksView; label: string }> = [
  { key: "unread", label: "未読" },
  { key: "archived", label: "アーカイブ" },
];

const SORT_OPTIONS: Array<{ key: LinksSortOrder; label: string }> = [
  { key: "newest", label: "新しい順" },
  { key: "oldest", label: "古い順" },
  { key: "random", label: "ランダム" },
];

export default function LinksControlsBar({
  view,
  onViewChange,
  unreadCount,
  archivedCount,
  query,
  onQueryChange,
  sortOrder,
  onSortOrderChange,
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

        {/* Sort order dropdown */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 12,
            background: "rgba(255,255,255,.8)",
            padding: "6px 10px 6px 12px",
            boxShadow: "inset 0 0 0 1px rgba(230,232,234,.6)",
          }}
        >
          <svg
            width={13}
            height={13}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "rgba(70,69,85,.45)", flexShrink: 0 }}
            aria-hidden="true"
          >
            <path d="M3 6h13M3 12h9M3 18h6" />
            <path d="M17 14l4 4 4-4" />
          </svg>
          <select
            value={sortOrder}
            onChange={(e) =>
              onSortOrderChange(e.target.value as LinksSortOrder)
            }
            aria-label="リンクの並び順"
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
              fontWeight: 500,
              color: "#464555",
              fontFamily: "inherit",
              cursor: "pointer",
              paddingRight: 18,
              backgroundImage: CHEVRON_DATA_URL,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 2px center",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* View mode toggle */}
        <LinksViewToggle value={viewMode} onChange={onViewModeChange} />
      </div>
    </div>
  );
}
