"use client";

/* eslint-disable @next/next/no-img-element */
import type { DisplayFields } from "../../lib/links/display";
import { highlightMatches } from "../../lib/links/highlight";
import { safeHostname } from "../../lib/links/viewMode";

type Props = {
  row: DisplayFields;
  normalizedQuery: string;
};

export default function LinksCompactRow({ row, normalizedQuery }: Props) {
  const hostname = safeHostname(row.sourceLabel);
  const initial = row.serviceName.charAt(0).toUpperCase() || "L";
  const dateLabel = new Date(row.createdAt).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });

  return (
    <li className="group flex items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50">
      <div className="shrink-0">
        {row.imageUrl ? (
          <img
            src={row.imageUrl}
            alt=""
            className="h-6 w-6 rounded object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-600">
            {initial}
          </div>
        )}
      </div>

      <a
        href={row.targetUrl}
        target="_blank"
        rel="noreferrer"
        className="flex-1 truncate text-sm text-slate-800 transition hover:text-indigo-600"
        title={row.title}
      >
        {highlightMatches(row.title, normalizedQuery)}
      </a>

      {hostname ? (
        <span
          className="hidden max-w-[220px] shrink-0 truncate text-xs text-slate-400 md:inline"
          title={hostname}
        >
          {highlightMatches(hostname, normalizedQuery)}
        </span>
      ) : null}

      <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
        {dateLabel}
      </span>

      <a
        href={row.targetUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="外部リンクを開く"
        className="shrink-0 text-slate-300 transition hover:text-indigo-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M7 17L17 7" />
          <path d="M8 7h9v9" />
        </svg>
      </a>
    </li>
  );
}
