"use client";

/* eslint-disable @next/next/no-img-element */
import type { DisplayFields } from "../../lib/links/display";
import { highlightMatches } from "../../lib/links/highlight";
import { safeHostname } from "../../lib/links/viewMode";

type Props = {
  row: DisplayFields;
  normalizedQuery: string;
  isRead: boolean;
  onToggleRead: (id: number, currentlyRead: boolean) => void;
};

export default function LinksCompactRow({
  row,
  normalizedQuery,
  isRead,
  onToggleRead,
}: Props) {
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

      <div className="flex min-w-0 flex-1 flex-col">
        <a
          href={row.targetUrl}
          target="_blank"
          rel="noreferrer"
          className="truncate text-sm text-slate-800 transition hover:text-indigo-600"
          title={row.title}
        >
          {highlightMatches(row.title, normalizedQuery)}
        </a>
        {row.description ? (
          <span
            className="truncate text-xs text-slate-400"
            title={row.description}
          >
            {highlightMatches(row.description, normalizedQuery)}
          </span>
        ) : null}
      </div>

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

      <button
        type="button"
        onClick={() => onToggleRead(row.id, isRead)}
        aria-label={isRead ? "未読に戻す" : "読んだ"}
        aria-pressed={isRead}
        className={[
          "shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-indigo-200",
          isRead
            ? "border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            : "border-slate-200 bg-white text-slate-300 hover:border-indigo-300 hover:text-indigo-500",
        ].join(" ")}
      >
        {isRead ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
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
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
          </svg>
        )}
      </button>
    </li>
  );
}
