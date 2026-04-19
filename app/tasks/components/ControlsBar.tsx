"use client";

import type { ProjectDto } from "../../../lib/my-task-sync";
import { CHEVRON_DATA_URL } from "../lib/chevron";
import type { StatusFilter } from "../lib/group-tasks";

export type ProjectFilter =
  | { kind: "all" }
  | { kind: "none" }
  | { kind: "named"; name: string };

export const PROJECT_FILTER_ALL: ProjectFilter = { kind: "all" };
export const PROJECT_FILTER_NONE: ProjectFilter = { kind: "none" };
export const PROJECT_VALUE_ALL = "__all__";
export const PROJECT_VALUE_NONE = "__none__";

export function projectFilterToValue(f: ProjectFilter): string {
  if (f.kind === "all") return PROJECT_VALUE_ALL;
  if (f.kind === "none") return PROJECT_VALUE_NONE;
  return `name:${f.name}`;
}

export function valueToProjectFilter(v: string): ProjectFilter {
  if (v === PROJECT_VALUE_ALL) return PROJECT_FILTER_ALL;
  if (v === PROJECT_VALUE_NONE) return PROJECT_FILTER_NONE;
  if (v.startsWith("name:")) return { kind: "named", name: v.slice(5) };
  return PROJECT_FILTER_ALL;
}

export function ControlsBar({
  tabs,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  projectFilter,
  onProjectFilterChange,
  projects,
}: {
  tabs: Array<{ key: StatusFilter; label: string; count: number }>;
  filter: StatusFilter;
  onFilterChange: (v: StatusFilter) => void;
  search: string;
  onSearchChange: (v: string) => void;
  projectFilter: ProjectFilter;
  onProjectFilterChange: (v: ProjectFilter) => void;
  projects: ProjectDto[];
}) {
  const inProjectScope = projectFilter.kind !== "all";
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
          {tabs.map((t) => {
            const on = t.key === filter;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onFilterChange(t.key)}
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
                  {t.count}
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
          >
            <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="タイトル・本文で検索…"
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
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
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

        <div
          style={{ height: 24, width: 1, background: "rgba(230,232,234,.8)" }}
        />

        {/* Project filter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 12,
            background: inProjectScope
              ? "linear-gradient(90deg, rgba(99,102,241,.08), rgba(79,70,229,.05))"
              : "rgba(255,255,255,.8)",
            padding: "6px 10px 6px 12px",
            boxShadow: inProjectScope
              ? "inset 0 0 0 1px rgba(99,102,241,.25)"
              : "inset 0 0 0 1px rgba(230,232,234,.6)",
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
            style={{
              color: inProjectScope ? "#4f46e5" : "rgba(70,69,85,.35)",
              flexShrink: 0,
            }}
          >
            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <select
            value={projectFilterToValue(projectFilter)}
            onChange={(e) =>
              onProjectFilterChange(valueToProjectFilter(e.target.value))
            }
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
              fontWeight: 500,
              color: inProjectScope ? "#3525cd" : "#464555",
              fontFamily: "inherit",
              cursor: "pointer",
              paddingRight: 18,
              backgroundImage: CHEVRON_DATA_URL,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 2px center",
            }}
          >
            <option value={PROJECT_VALUE_ALL}>All projects</option>
            <option value={PROJECT_VALUE_NONE}>未設定のみ</option>
            <option disabled>──────────</option>
            {projects.map((p) => (
              <option key={p.id} value={`name:${p.name}`}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
