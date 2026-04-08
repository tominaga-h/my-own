import { db } from "./db";
import { links, notes, syncStates } from "../db/schema";
import { getMostLikelySelfDm, type SlackMessage } from "./slack";

type SyncResult = {
  databaseUserId: string;
  authedUserId: string;
  fetchedMessages: number;
  notesInserted: number;
  linksInserted: number;
  lastMessageTs: string | null;
};

function extractUrls(text: string) {
  return text.match(/https?:\/\/[^\s<>"]+/g) ?? [];
}

function cleanText(text: string) {
  return text.trim();
}

function compareSlackTs(left: string, right: string) {
  const [leftSeconds, leftFraction = ""] = left.split(".");
  const [rightSeconds, rightFraction = ""] = right.split(".");

  if (leftSeconds !== rightSeconds) {
    return Number(leftSeconds) - Number(rightSeconds);
  }

  return leftFraction.localeCompare(rightFraction);
}

function isLinkMessage(message: SlackMessage) {
  return extractUrls(message.text ?? "").length > 0;
}

function getDatabaseUserId() {
  const userId = process.env.APP_USER_ID;
  if (!userId) {
    throw new Error("APP_USER_ID is required");
  }

  return userId;
}

export async function syncSlackSelfDmToDatabase(): Promise<SyncResult> {
  const payload = await getMostLikelySelfDm();
  const databaseUserId = getDatabaseUserId();
  let notesInserted = 0;
  let linksInserted = 0;
  let lastMessageTs: string | null = null;

  const messages = payload.messages
    .filter((message) => cleanText(message.text ?? "").length > 0)
    .filter((message) => message.type === "message");

  for (const message of messages) {
    const text = cleanText(message.text ?? "");
    if (!lastMessageTs || compareSlackTs(message.ts, lastMessageTs) > 0) {
      lastMessageTs = message.ts;
    }

    if (isLinkMessage(message)) {
      const [url] = extractUrls(text);
      if (!url) {
        continue;
      }
      const attachment = message.attachments?.[0] ?? null;
      const title = attachment?.title ?? null;
      const description = attachment?.text ?? text.replace(url, "").trim();

      const inserted = await db
        .insert(links)
        .values({
          userId: databaseUserId,
          url,
          title,
          description: description || null,
          slackAttachments: message.attachments ?? null,
          source: "slack",
          slackTs: message.ts,
          projectId: null,
        })
        .onConflictDoNothing({ target: [links.userId, links.slackTs] })
        .returning({ id: links.id });

      linksInserted += inserted.length;
      continue;
    }

    const inserted = await db
      .insert(notes)
      .values({
        userId: databaseUserId,
        body: text,
        source: "slack",
        slackTs: message.ts,
        projectId: null,
      })
      .onConflictDoNothing({ target: [notes.userId, notes.slackTs] })
      .returning({ id: notes.id });

    notesInserted += inserted.length;
  }

  if (lastMessageTs) {
    await db
      .insert(syncStates)
      .values({
        userId: databaseUserId,
        key: "slack_last_ts",
        value: lastMessageTs,
      })
      .onConflictDoUpdate({
        target: [syncStates.userId, syncStates.key],
        set: {
          value: lastMessageTs,
          updatedAt: new Date(),
        },
      });
  }

  return {
    databaseUserId,
    authedUserId: payload.authed_user_id,
    fetchedMessages: messages.length,
    notesInserted,
    linksInserted,
    lastMessageTs,
  };
}
