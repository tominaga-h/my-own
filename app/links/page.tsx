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
    .orderBy(desc(links.createdAt))
    .limit(100);

  return (
    <main className="links-page">
      <header className="links-hero">
        <div>
          <p className="eyebrow">my-own</p>
          <h1>Links</h1>
          <p>Slack から同期されたリンクを最近の順で表示します。</p>
        </div>
        <div className="links-hero-meta">
          <Link href="/">Home</Link>
          <span>{rows.length} items</span>
        </div>
      </header>

      <section className="links-grid">
        {rows.map((row) => {
          const attachments = asAttachments(row.slackAttachments);
          const attachment = attachments[0];
          const title = row.title ?? attachment?.title ?? row.url;
          const description =
            row.description ?? attachment?.text ?? attachment?.fallback ?? "";
          const imageUrl = attachment?.image_url ?? attachment?.thumb_url ?? null;
          const serviceName = attachment?.service_name ?? null;
          const targetUrl = attachment?.title_link ?? attachment?.original_url ?? row.url;

          return (
            <article className="link-card" key={row.id}>
              {imageUrl ? (
                <a className="link-thumb" href={targetUrl} target="_blank" rel="noreferrer">
                  <img src={imageUrl} alt="" />
                </a>
              ) : null}

              <div className="link-body">
                <div className="link-kicker">
                  <span>{serviceName ?? "Link"}</span>
                  <time>{new Date(row.createdAt).toLocaleDateString("ja-JP")}</time>
                </div>

                <h2>
                  <a href={targetUrl} target="_blank" rel="noreferrer">
                    {title}
                  </a>
                </h2>

                {description ? <p>{truncate(description)}</p> : null}

                <div className="link-footer">
                  <a href={row.url} target="_blank" rel="noreferrer">
                    {row.url}
                  </a>
                </div>
              </div>
            </article>
          );
        })}

        {rows.length === 0 ? (
          <div className="empty-state">
            <p>まだリンクがありません。Slack 同期を先に走らせてください。</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
