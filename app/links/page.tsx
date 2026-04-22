"use client";

/* eslint-disable @next/next/no-img-element */
import { useDeferredValue, useMemo, useState } from "react";
import useSWR from "swr";

import { highlightMatches } from "./highlight";
import LinksSkeleton from "./LinksSkeleton";
import { filterLinksByQuery, type LinkSearchRecord } from "./search";

type SlackAttachment = {
  title?: string;
  text?: string;
  image_url?: string;
  thumb_url?: string;
  service_name?: string;
  original_url?: string;
  title_link?: string;
  fallback?: string;
};

type LinksResponse = {
  links: Array<{
    id: number;
    url: string;
    title: string | null;
    description: string | null;
    slackAttachments: unknown[] | null;
    createdAt: string;
    postedAt: string;
  }>;
  lastSyncAt: string | null;
};

function asAttachments(value: unknown) {
  return Array.isArray(value) ? (value as SlackAttachment[]) : [];
}

function truncate(text: string, max = 180) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export default function LinksPage() {
  const { data, isLoading } = useSWR<LinksResponse>("/api/links?limit=100");
  const rows = useMemo(() => data?.links ?? [], [data?.links]);
  const lastSyncedAt = data?.lastSyncAt ?? null;
  const showSkeleton = isLoading && !data;

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim();

  const searchRecords = useMemo<LinkSearchRecord[]>(
    () =>
      rows.map((row) => {
        const attachments = asAttachments(row.slackAttachments);
        const attachment = attachments[0];
        return {
          id: row.id,
          title: row.title ?? attachment?.title ?? row.url,
          url: row.url,
          description:
            row.description ?? attachment?.text ?? attachment?.fallback ?? "",
        };
      }),
    [rows],
  );

  const matchedIds = useMemo(() => {
    if (!normalizedQuery) return null;
    return new Set(
      filterLinksByQuery(searchRecords, normalizedQuery).map((r) => r.id),
    );
  }, [searchRecords, normalizedQuery]);

  const filteredRows = matchedIds
    ? rows.filter((row) => matchedIds.has(row.id))
    : rows;

  if (showSkeleton) {
    return <LinksSkeleton />;
  }

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
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label htmlFor="links-search" className="sr-only">
              リンクを検索
            </label>
            <input
              id="links-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトル / URL / description を検索"
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 sm:w-80"
            />
            {normalizedQuery ? (
              <span className="whitespace-nowrap text-xs text-slate-400">
                {filteredRows.length} 件
              </span>
            ) : null}
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
          {filteredRows.map((row, index) => {
            const attachments = asAttachments(row.slackAttachments);
            const attachment = attachments[0];
            const title = row.title ?? attachment?.title ?? row.url;
            const description =
              row.description ?? attachment?.text ?? attachment?.fallback ?? "";
            const imageUrl = attachment?.image_url ?? attachment?.thumb_url ?? null;
            const serviceName = attachment?.service_name ?? "Link";
            const targetUrl = attachment?.title_link ?? attachment?.original_url ?? row.url;
            const sourceLabel = attachment?.original_url ?? row.url;

            return (
              <article
                key={row.id}
                className={[
                  "group overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(99,102,241,0.1)]",
                  imageUrl ? "" : "border-l-2 border-l-indigo-200",
                ].join(" ")}
              >
                {imageUrl ? (
                  <a
                    className="relative block aspect-[40/21] overflow-hidden bg-slate-100"
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-full w-full object-contain bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.1),_transparent_40%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] transition duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/1 to-transparent" />
                    <div className="absolute left-4 top-4 inline-flex rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-white backdrop-blur">
                      {serviceName}
                    </div>
                  </a>
                ) : null}

                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                        #{row.id}
                      </span>
                      {!imageUrl && (
                        <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold tracking-[0.16em] text-indigo-600">
                          {serviceName}
                        </span>
                      )}
                    </div>
                    <span>{new Date(row.createdAt).toLocaleDateString("ja-JP")}</span>
                  </div>

                  <div className="space-y-2 md:min-h-[232px]">
                    <h2 className="text-lg font-semibold leading-7 text-slate-900">
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-indigo-600"
                      >
                        {highlightMatches(title, normalizedQuery)}
                      </a>
                    </h2>
                    {description ? (
                      <p className="text-sm leading-6 text-slate-500">
                        {highlightMatches(truncate(description), normalizedQuery)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="max-w-full truncate text-sm font-medium text-slate-700 transition hover:text-indigo-600"
                      title={sourceLabel}
                    >
                      {highlightMatches(sourceLabel, normalizedQuery)}
                    </a>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                      {index + 1}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}

          {data && rows.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-indigo-200 bg-white/80 p-8 text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
              まだリンクがありません。Slack 同期を先に走らせてください。
            </div>
          ) : data && rows.length > 0 && filteredRows.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-8 text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
              「{normalizedQuery}」に一致するリンクはありません。
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
