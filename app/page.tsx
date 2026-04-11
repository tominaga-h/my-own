/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import {
  getRecentNotes,
  getRecentLinks,
  getCollectionStats,
  getLastSyncTime,
  getProjectsWithCounts,
} from "../lib/queries";
import { getGreeting, getNoteHeadline, relativeTime, truncateText } from "../lib/format";
import QuickCapture from "./components/QuickCapture";

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

function asAttachments(value: unknown) {
  return Array.isArray(value) ? (value as SlackAttachment[]) : [];
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const [recentNotes, recentLinks, stats, lastSyncedAt, projects] =
    await Promise.all([
      getRecentNotes(5),
      getRecentLinks(4),
      getCollectionStats(),
      getLastSyncTime(),
      getProjectsWithCounts(),
    ]);

  const now = new Date();
  const hour = Number(
    now.toLocaleString("en-US", { timeZone: "Asia/Tokyo", hour: "numeric", hour12: false }),
  );
  const greeting = getGreeting(hour);
  const isEmpty = stats.notesCount === 0 && stats.linksCount === 0;

  return (
    <main className="min-h-screen px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col">
        {/* Greeting + Pulse */}
        <section className="flex flex-wrap items-baseline justify-between gap-4 px-1 py-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {greeting}
          </h1>
          <div className="flex items-center gap-5 text-xs tracking-[0.18em] uppercase text-slate-400">
            <span>{stats.notesCount} notes</span>
            <span>{stats.linksCount} links</span>
            {lastSyncedAt && (
              <span>Synced {relativeTime(lastSyncedAt)}</span>
            )}
          </div>
        </section>

        {/* Quick Capture */}
        <section className="mt-8 rounded-xl bg-white p-5">
          <QuickCapture />
        </section>

        {/* Empty State */}
        {isEmpty && (
          <section className="mt-12 rounded-xl bg-white/60 px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              コレクションは空です。上にメモを書くか、Slack DMを同期しましょう。
            </p>
          </section>
        )}

        {/* Recent Notes */}
        {recentNotes.length > 0 && (
          <section className="mt-12">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Notes
              </h2>
              <Link
                href="/notes"
                className="text-sm font-medium text-[#3525cd] transition hover:opacity-70"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-1">
              {recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href="/notes"
                  className="note-row flex items-center justify-between gap-4 rounded-lg px-4 py-3.5 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {truncateText(getNoteHeadline(note.body), 80)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="rounded-md bg-[#dbe2fa] px-2 py-0.5 text-[11px] font-medium text-[#5d6478]">
                      {note.source}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {relativeTime(note.postedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Links */}
        {recentLinks.length > 0 && (
          <section className="mt-12">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Links
              </h2>
              <Link
                href="/links"
                className="text-sm font-medium text-[#3525cd] transition hover:opacity-70"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {recentLinks.map((link) => {
                const attachments = asAttachments(link.slackAttachments);
                const attachment = attachments[0];
                const title = link.title ?? attachment?.title ?? link.url;
                const description =
                  link.description ?? attachment?.text ?? attachment?.fallback ?? "";
                const imageUrl =
                  attachment?.image_url ?? attachment?.thumb_url ?? null;
                const serviceName = attachment?.service_name ?? "Link";
                const targetUrl =
                  attachment?.title_link ?? attachment?.original_url ?? link.url;

                return (
                  <a
                    key={link.id}
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.06)]"
                  >
                    {imageUrl ? (
                      <div className="relative aspect-[40/21] overflow-hidden bg-slate-50">
                        <img
                          src={imageUrl}
                          alt=""
                          className="h-full w-full object-contain bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.1),_transparent_40%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] transition duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-white backdrop-blur">
                          {serviceName}
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-[40/21] bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.1),_transparent_40%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,1))]">
                        <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-white backdrop-blur">
                          {serviceName}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900 transition group-hover:text-[#3525cd]">
                        {truncateText(title, 60)}
                      </h3>
                      {description && (
                        <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                          {truncateText(description, 100)}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        {relativeTime(link.postedAt)}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="mt-12 mb-12">
            <h2 className="px-1 text-lg font-semibold text-slate-900">
              Projects
            </h2>
            <div className="mt-4 space-y-1">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-800">
                    {project.name}
                  </span>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>{project.notesCount} notes</span>
                    <span>{project.linksCount} links</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
