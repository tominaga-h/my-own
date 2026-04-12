"use client";

/* eslint-disable @next/next/no-img-element */
import useSWR from "swr";

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
  const { data } = useSWR<LinksResponse>("/api/links?limit=100");
  const rows = data?.links ?? [];
  const lastSyncedAt = data?.lastSyncAt ?? null;

  return (
    <main className="min-h-screen px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="px-1 py-2">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
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
          </div>
        </div>

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
                  <div className="relative flex aspect-[40/21] items-end bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.1),_transparent_40%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] p-5">
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

                  <div className="min-h-[232px] space-y-2">
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

          {!data && (
            <div className="rounded-[28px] border border-dashed border-indigo-200 bg-white/80 p-8 text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
              Loading links...
            </div>
          )}
          {data && rows.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-indigo-200 bg-white/80 p-8 text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
              まだリンクがありません。Slack 同期を先に走らせてください。
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
