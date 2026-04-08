/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { asc, eq } from "drizzle-orm";

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
    .orderBy(asc(links.id))
    .limit(100);

  const latest = rows[0] ?? null;
  const totalImageCount = rows.filter((row) => asAttachments(row.slackAttachments)[0]?.image_url || asAttachments(row.slackAttachments)[0]?.thumb_url).length;

  return (
    <main className="min-h-screen px-4 py-6 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="overflow-hidden rounded-md border border-white/60 bg-white/70 shadow-[0_18px_50px_rgba(23,23,23,0.08)] backdrop-blur">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_0.9fr] lg:p-8">
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                my-own inbox
              </div>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl lg:text-6xl">
                My Links
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
                Slack から同期されたリンクを、ID の降順で並べたアーカイブ。
                タイトル、要約、サムネイルをそのまま眺められる UI にしています。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-sm"
                >
                  Home
                </Link>
                <a
                  href="/debug/slack-sync"
                  className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white hover:shadow-sm"
                >
                  Slack Sync Debug
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border border-stone-200 bg-stone-950 p-5 text-white shadow-lg">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Total</p>
                <p className="mt-3 text-xl font-semibold">{rows.length}</p>
                <p className="mt-1 text-sm text-stone-300">stored links</p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Latest</p>
                <p className="mt-3 text-2xl font-semibold text-stone-950">
                  #{latest?.id ?? "—"}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {latest ? new Date(latest.createdAt).toLocaleDateString("ja-JP") : "No data"}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">With images</p>
                <p className="mt-3 text-2xl font-semibold text-stone-950">{totalImageCount}</p>
                <p className="mt-1 text-sm text-stone-500">cards with preview art</p>
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
                className="group overflow-hidden rounded-xl border border-stone-200 bg-white transition duration-200 hover:-translate-y-1"
              >
                {imageUrl ? (
                  <a
                    className="relative block aspect-[40/21] overflow-hidden bg-stone-100"
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-full w-full object-fit transition duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <div className="absolute left-4 top-4 inline-flex rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-white backdrop-blur">
                      {serviceName}
                    </div>
                  </a>
                ) : (
                  <div className="flex aspect-[411/257] items-end bg-[radial-gradient(circle_at_top_right,_rgba(180,83,9,0.14),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(245,245,244,0.95))] p-5">
                    <div className="rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
                      {serviceName}
                    </div>
                  </div>
                )}

                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 font-semibold text-stone-600">
                      #{row.id}
                    </span>
                    <span>{new Date(row.createdAt).toLocaleDateString("ja-JP")}</span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold leading-7 text-stone-950">
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-amber-700"
                      >
                        {title}
                      </a>
                    </h2>
                    {description ? (
                      <p className="text-sm leading-6 text-stone-600">
                        {truncate(description)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="max-w-full truncate text-sm font-medium text-stone-900 transition hover:text-amber-700"
                      title={sourceLabel}
                    >
                      {sourceLabel}
                    </a>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
                      {index + 1}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}

          {rows.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-[28px] border border-dashed border-stone-300 bg-white/70 p-8 text-stone-600 shadow-sm">
              まだリンクがありません。Slack 同期を先に走らせてください。
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
