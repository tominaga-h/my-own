export type SlackAttachment = {
  title?: string;
  text?: string;
  image_url?: string;
  thumb_url?: string;
  service_name?: string;
  original_url?: string;
  title_link?: string;
  fallback?: string;
};

export type LinkRow = {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  slackAttachments: unknown[] | null;
  createdAt: string;
  postedAt: string;
  readAt: string | null;
};

export type DisplayFields = {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  serviceName: string;
  targetUrl: string;
  sourceLabel: string;
  rawUrl: string;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
};

function asAttachments(value: unknown): SlackAttachment[] {
  return Array.isArray(value) ? (value as SlackAttachment[]) : [];
}

/**
 * Single source of truth for mapping a raw LinkRow into its display fields.
 * Both the search/filter layer and the render layer consume this, so the
 * searchable text is always identical to what the user actually sees.
 */
export function deriveDisplayFields(row: LinkRow): DisplayFields {
  const attachments = asAttachments(row.slackAttachments);
  const attachment = attachments[0];
  return {
    id: row.id,
    title: row.title ?? attachment?.title ?? row.url,
    description:
      row.description ?? attachment?.text ?? attachment?.fallback ?? "",
    imageUrl: attachment?.image_url ?? attachment?.thumb_url ?? null,
    serviceName: attachment?.service_name ?? "Link",
    targetUrl: attachment?.title_link ?? attachment?.original_url ?? row.url,
    sourceLabel: attachment?.original_url ?? row.url,
    rawUrl: row.url,
    createdAt: row.createdAt,
    isRead: Boolean(row.readAt),
    readAt: row.readAt,
  };
}
