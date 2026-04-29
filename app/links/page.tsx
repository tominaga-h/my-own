"use client";

/* eslint-disable @next/next/no-img-element */
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { apiFetchJson } from "../../lib/api-client";
import { useApiKey } from "../providers";
import {
  deriveDisplayFields,
  type DisplayFields,
  type LinkRow,
} from "../../lib/links/display";
import { highlightMatches } from "../../lib/links/highlight";
import { partitionByRead } from "../../lib/links/partition";
import {
  filterLinksByQuery,
  truncateAroundMatch,
  type LinkSearchRecord,
} from "../../lib/links/search";
import { shuffle } from "../../lib/links/shuffle";
import {
  DEFAULT_VIEW_MODE,
  VIEW_MODE_STORAGE_KEY,
  parseViewMode,
  type ViewMode,
} from "../../lib/links/viewMode";

import LinksCompactRow from "./LinksCompactRow";
import LinksControlsBar, { type LinksView } from "./LinksControlsBar";
import LinksSkeleton from "./LinksSkeleton";

type LinksResponse = {
  links: LinkRow[];
  lastSyncAt: string | null;
};

const DESCRIPTION_MAX = 180;

export default function LinksPage() {
  const apiKey = useApiKey();
  const { data, isLoading, mutate } = useSWR<LinksResponse>(
    "/api/links?limit=100",
  );
  const rows = useMemo(() => data?.links ?? [], [data?.links]);
  const lastSyncedAt = data?.lastSyncAt ?? null;
  const showSkeleton = isLoading && !data;

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim();
  const [randomOrderIds, setRandomOrderIds] = useState<number[] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [view, setView] = useState<LinksView>("unread");

  // マウント後に localStorage から復元。SSR と初期レンダリングは固定の "card" を使用して
  // hydration mismatch を避ける。
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      setViewMode(parseViewMode(raw));
    } catch {
      // localStorage が使えない環境（プライベートブラウジング等）は無視。
    }
  }, []);

  const handleViewModeChange = (next: ViewMode) => {
    setViewMode(next);
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
    } catch {
      // localStorage が使えない環境では保存を諦め、現セッションのみ反映する。
    }
  };

  const displayRows = useMemo<DisplayFields[]>(
    () => rows.map(deriveDisplayFields),
    [rows],
  );

  const { unread: unreadRows, archived: archivedRows } = useMemo(
    () => partitionByRead(displayRows),
    [displayRows],
  );

  const visibleRows = view === "archived" ? archivedRows : unreadRows;

  const searchedRows = useMemo<DisplayFields[]>(() => {
    if (!normalizedQuery) return visibleRows;
    const searchRecords: LinkSearchRecord[] = visibleRows.map((d) => ({
      id: d.id,
      title: d.title,
      url: d.rawUrl,
      sourceLabel: d.sourceLabel,
      description: d.description,
    }));
    const matchedIds = new Set(
      filterLinksByQuery(searchRecords, normalizedQuery).map((r) => r.id),
    );
    return visibleRows.filter((d) => matchedIds.has(d.id));
  }, [visibleRows, normalizedQuery]);

  const filteredRows = useMemo<DisplayFields[]>(() => {
    // 検索中はランダム並びを無視して API 順を維持する。
    if (normalizedQuery) return searchedRows;
    if (randomOrderIds === null) return searchedRows;
    const byId = new Map(searchedRows.map((d) => [d.id, d]));
    const ordered: DisplayFields[] = [];
    const seen = new Set<number>();
    for (const id of randomOrderIds) {
      const row = byId.get(id);
      if (row) {
        ordered.push(row);
        seen.add(id);
      }
    }
    // randomOrderIds 記録後に新着で追加された id は末尾に差し込み、欠落を防ぐ。
    for (const row of searchedRows) {
      if (!seen.has(row.id)) ordered.push(row);
    }
    return ordered;
  }, [searchedRows, normalizedQuery, randomOrderIds]);

  const handleShuffle = () => {
    const ids = searchedRows.map((d) => d.id);
    setRandomOrderIds(shuffle(ids));
  };

  const handleToggleRead = async (id: number, currentlyRead: boolean) => {
    const nextReadAt = currentlyRead ? null : new Date().toISOString();
    const optimistic: LinksResponse | undefined = data
      ? {
          ...data,
          links: data.links.map((l) =>
            l.id === id ? { ...l, readAt: nextReadAt } : l,
          ),
        }
      : data;

    try {
      await mutate(
        async () => {
          await apiFetchJson(apiKey, `/api/links/${id}/read`, {
            method: currentlyRead ? "DELETE" : "POST",
          });
          // 成功時は最新を再取得して整合性を担保する。
          return await apiFetchJson<LinksResponse>(
            apiKey,
            "/api/links?limit=100",
          );
        },
        {
          optimisticData: optimistic,
          rollbackOnError: true,
          revalidate: false,
        },
      );
    } catch (error) {
      // 失敗時は SWR が自動でロールバックする。
      console.error("[links] toggle read failed", error);
    }
  };

  if (showSkeleton) {
    return <LinksSkeleton />;
  }

  const hasAnyRows = rows.length > 0;
  const isArchivedView = view === "archived";

  return (
    <main className="min-h-screen px-3 py-3 text-slate-800 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 py-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              My Links
            </h1>
            {lastSyncedAt && (
              <p className="mt-1 text-sm text-slate-400">
                最終同期:{" "}
                {new Date(lastSyncedAt).toLocaleString("ja-JP", {
                  timeZone: "Asia/Tokyo",
                })}
              </p>
            )}
          </div>
          {normalizedQuery ? (
            <span className="whitespace-nowrap text-xs text-slate-400">
              {filteredRows.length} 件
            </span>
          ) : null}
        </div>

        <LinksControlsBar
          view={view}
          onViewChange={setView}
          unreadCount={unreadRows.length}
          archivedCount={archivedRows.length}
          query={query}
          onQueryChange={setQuery}
          onShuffle={handleShuffle}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />

        {viewMode === "card" ? (
          <section className="grid gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {filteredRows.map((d, index) => {
              const descriptionSnippet = d.description
                ? truncateAroundMatch(d.description, DESCRIPTION_MAX, normalizedQuery)
                : "";

              return (
                <article
                  key={d.id}
                  className={[
                    "group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(99,102,241,0.1)]",
                    d.imageUrl ? "" : "border-l-2 border-l-indigo-200",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleRead(d.id, d.isRead)}
                    aria-label={d.isRead ? "未読に戻す" : "読んだ"}
                    aria-pressed={d.isRead}
                    className={[
                      "absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition focus:outline-none focus:ring-2 focus:ring-indigo-200",
                      d.isRead
                        ? "border-emerald-300 bg-emerald-50/90 text-emerald-600 hover:bg-emerald-100"
                        : "border-slate-200 bg-white/80 text-slate-400 hover:border-indigo-300 hover:text-indigo-500",
                    ].join(" ")}
                  >
                    {d.isRead ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )}
                  </button>
                  {d.imageUrl ? (
                    <a
                      className="relative block aspect-[40/21] overflow-hidden bg-slate-100"
                      href={d.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={d.imageUrl}
                        alt=""
                        className="h-full w-full object-contain bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.1),_transparent_40%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] transition duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/1 to-transparent" />
                      <div className="absolute left-4 top-4 inline-flex rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-white backdrop-blur">
                        {d.serviceName}
                      </div>
                    </a>
                  ) : null}

                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                          #{d.id}
                        </span>
                        {!d.imageUrl && (
                          <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold tracking-[0.16em] text-indigo-600">
                            {d.serviceName}
                          </span>
                        )}
                      </div>
                      <span>{new Date(d.createdAt).toLocaleDateString("ja-JP")}</span>
                    </div>

                    <div className="space-y-2 md:min-h-[232px]">
                      <h2 className="text-lg font-semibold leading-7 text-slate-900">
                        <a
                          href={d.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="transition hover:text-indigo-600"
                        >
                          {highlightMatches(d.title, normalizedQuery)}
                        </a>
                      </h2>
                      {descriptionSnippet ? (
                        <p className="text-sm leading-6 text-slate-500">
                          {highlightMatches(descriptionSnippet, normalizedQuery)}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <a
                        href={d.rawUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="max-w-full truncate text-sm font-medium text-slate-700 transition hover:text-indigo-600"
                        title={d.sourceLabel}
                      >
                        {highlightMatches(d.sourceLabel, normalizedQuery)}
                      </a>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}

            {data && !hasAnyRows ? (
              <div className="rounded-[28px] border border-dashed border-indigo-200 bg-white/80 p-8 text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
                まだリンクがありません。Slack 同期を先に走らせてください。
              </div>
            ) : data && filteredRows.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-8 text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
                {normalizedQuery
                  ? `「${normalizedQuery}」に一致するリンクはありません。`
                  : isArchivedView
                    ? "アーカイブはまだありません。"
                    : "未読のリンクはありません。"}
              </div>
            ) : null}
          </section>
        ) : (
          <section>
            {filteredRows.length > 0 ? (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {filteredRows.map((d) => (
                  <LinksCompactRow
                    key={d.id}
                    row={d}
                    normalizedQuery={normalizedQuery}
                    isRead={d.isRead}
                    onToggleRead={handleToggleRead}
                  />
                ))}
              </ul>
            ) : data && !hasAnyRows ? (
              <div className="rounded-[28px] border border-dashed border-indigo-200 bg-white/80 p-8 text-slate-500 shadow-sm">
                まだリンクがありません。Slack 同期を先に走らせてください。
              </div>
            ) : data ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-8 text-slate-500 shadow-sm">
                {normalizedQuery
                  ? `「${normalizedQuery}」に一致するリンクはありません。`
                  : isArchivedView
                    ? "アーカイブはまだありません。"
                    : "未読のリンクはありません。"}
              </div>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}
