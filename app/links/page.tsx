/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "../../lib/db";
import { links } from "../../db/schema";

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

function getDatabaseUserId() {
  const userId = process.env.APP_USER_ID;
  if (!userId) {
    throw new Error("APP_USER_ID is required");
  }

  return userId;
}

function asAttachments(value: unknown) {
  return Array.isArray(value) ? (value as SlackAttachment[]) : [];
}

function truncate(text: string, max = 180) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const databaseUserId = getDatabaseUserId();
  const rows = await db
    .select()
    .from(links)
    .where(eq(links.userId, databaseUserId))
    .orderBy(desc(links.postedAt))
    .limit(100);

  const latest = rows[0] ?? null;
  const totalImageCount = rows.filter((row) => asAttachments(row.slackAttachments)[0]?.image_url || asAttachments(row.slackAttachments)[0]?.thumb_url).length;

  return (
    <main className="min-h-screen px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="overflow-hidden rounded-xl border border-indigo-100 bg-white/80 shadow-[0_18px_50px_rgba(99,102,241,0.07)] backdrop-blur">
          <div className="p-6 lg:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              my-own inbox
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              My Links
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
              Slack から同期されたリンクを、ID の降順で並べたアーカイブ。
              タイトル、要約、サムネイルをそのまま眺められる UI にしています。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-indigo-200/60 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_4px_12px_rgba(99,102,241,0.1)]"
              >
                Home
              </Link>
              <a
                href="/debug/slack-sync"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-[0_4px_12px_rgba(99,102,241,0.1)]"
              >
                Slack Sync Debug
              </a>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-indigo-500 bg-indigo-600 p-5 text-white shadow-lg shadow-indigo-200">
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-200">Total</p>
                <p className="mt-3 text-xl font-semibold">{rows.length}</p>
                <p className="mt-1 text-sm text-indigo-200">stored links</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  #{latest?.id ?? "—"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {latest ? new Date(latest.createdAt).toLocaleDateString("ja-JP") : "No data"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">With images</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{totalImageCount}</p>
                <p className="mt-1 text-sm text-slate-500">cards with preview art</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row, index) => {
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
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(99,102,241,0.1)]"
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
                ) : (
                  <div className="flex relative aspect-[40/21] items-end bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.1),_transparent_40%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] p-5">
                    <div className="absolute left-4 top-4 inline-flex rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-white backdrop-blur">
                      {serviceName}
                    </div>
                  </div>
                )}

                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                      #{row.id}
                    </span>
                    <span>{new Date(row.createdAt).toLocaleDateString("ja-JP")}</span>
                  </div>

                  <div className="space-y-2 min-h-[232px]">
                    <h2 className="text-lg font-semibold leading-7 text-slate-900">
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-indigo-600"
                      >
                        {title}
                      </a>
                    </h2>
                    {description ? (
                      <p className="text-sm leading-6 text-slate-500">
                        {truncate(description)}
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
                      {sourceLabel}
                    </a>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                      {index + 1}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}

          {rows.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-[28px] border border-dashed border-indigo-200 bg-white/80 p-8 text-slate-500 shadow-sm">
              まだリンクがありません。Slack 同期を先に走らせてください。
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
