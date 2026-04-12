"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import useSWR from "swr";

import HeroSection from "./components/HeroSection";
import QuickCapture from "./components/QuickCapture";
import { getGreeting, getNoteHeadline, relativeTime, truncateText } from "../lib/format";

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

type HomeStats = {
  notesCount: number;
  linksCount: number;
  lastSyncAt: string | null;
};

type HomeRecent = {
  recentNotes: Array<{
    id: number;
    body: string;
    source: string;
    postedAt: string;
  }>;
  recentLinks: Array<{
    id: number;
    url: string;
    title: string | null;
    description: string | null;
    slackAttachments: unknown[] | null;
    postedAt: string;
  }>;
};

type HomeProjects = {
  projects: Array<{
    id: number;
    name: string;
    notesCount: number;
    linksCount: number;
  }>;
};

function asAttachments(value: unknown) {
  return Array.isArray(value) ? (value as SlackAttachment[]) : [];
}

export default function Home() {
  const statsResult = useSWR<HomeStats>("/api/data/stats");
  const recentResult = useSWR<HomeRecent>("/api/data/recent");
  const projectsResult = useSWR<HomeProjects>("/api/data/projects");

  const stats = statsResult.data ?? {
    notesCount: 0,
    linksCount: 0,
    lastSyncAt: null,
  };
  const recentNotes = recentResult.data?.recentNotes ?? [];
  const recentLinks = recentResult.data?.recentLinks ?? [];
  const projects = projectsResult.data?.projects ?? [];

  const now = new Date();
  const hour = Number(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Tokyo",
      hour: "numeric",
      hour12: false,
    }),
  );
  const greeting = getGreeting(hour);
  const isEmpty = stats.notesCount === 0 && stats.linksCount === 0;
  const isLoading =
    !statsResult.data || !recentResult.data || !projectsResult.data;

  return (
    <main className="min-h-screen text-slate-800">
      <HeroSection />

      <div className="mx-auto flex max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-wrap items-baseline justify-between gap-4 px-1 py-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {greeting}
          </h2>
          <div className="flex items-center gap-5 text-xs uppercase tracking-[0.18em] text-slate-400">
            <span>{isLoading ? "..." : `${stats.notesCount} notes`}</span>
            <span>{isLoading ? "..." : `${stats.linksCount} links`}</span>
            {stats.lastSyncAt && (
              <span>Synced {relativeTime(stats.lastSyncAt)}</span>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-xl bg-white p-5">
          <QuickCapture />
        </section>

        {isEmpty && !isLoading && (
          <section className="mt-12 rounded-xl bg-white/60 px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              コレクションは空です。上にメモを書くか、Slack DMを同期しましょう。
            </p>
          </section>
        )}

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
            {!recentResult.data && (
              <div className="rounded-lg bg-white/60 px-4 py-3 text-sm text-slate-500">
                Loading recent notes...
              </div>
            )}
          </div>
        </section>

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
              const imageUrl = attachment?.image_url ?? attachment?.thumb_url ?? null;
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
            {!recentResult.data && (
              <div className="rounded-xl bg-white/60 p-4 text-sm text-slate-500">
                Loading recent links...
              </div>
            )}
          </div>
        </section>

        {projects.length > 0 && (
          <section className="mb-12 mt-12">
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
