type SlackApiOk<T> = { ok: true } & T;
type SlackApiError = { ok: false; error: string };

export type SlackConversation = {
  id: string;
  user?: string;
  is_im?: boolean;
  is_mpim?: boolean;
  is_private?: boolean;
  name?: string;
  created?: number;
};

export type SlackMessage = {
  type: string;
  user?: string;
  text?: string;
  ts: string;
  channel?: string;
  thread_ts?: string;
};

export type SlackSelfDmResult = {
  authed_user_id: string;
  conversation: SlackConversation | null;
  conversations: SlackConversation[];
  messages: SlackMessage[];
};

function getSlackToken() {
  return process.env.SLACK_USER_TOKEN ?? process.env.SLACK_BOT_TOKEN;
}

async function slackApi<T>(method: string, params: Record<string, string>) {
  const token = getSlackToken();
  if (!token) {
    throw new Error("SLACK_USER_TOKEN or SLACK_BOT_TOKEN is required");
  }

  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: new URLSearchParams(params),
  });

  const payload = (await response.json()) as SlackApiOk<T> | SlackApiError;
  if (!response.ok || !payload.ok) {
    throw new Error(
      `Slack API request failed for ${method}: ${
        "error" in payload ? payload.error : response.statusText
      }`,
    );
  }

  return payload;
}

export async function getAuthedUserId() {
  const payload = await slackApi<{ user_id?: string }>("auth.test", {});
  if (!payload.user_id) {
    throw new Error("Slack auth.test did not return user_id");
  }

  return payload.user_id;
}

export async function listDmConversations() {
  const conversations: SlackConversation[] = [];
  let cursor = "";

  do {
    const payload = await slackApi<{ channels?: SlackConversation[]; response_metadata?: { next_cursor?: string } }>(
      "users.conversations",
      {
        types: "im",
        limit: "1000",
        cursor,
      },
    );

    conversations.push(...(payload.channels ?? []));
    cursor = payload.response_metadata?.next_cursor ?? "";
  } while (cursor);

  return conversations;
}

export async function getMostLikelySelfDm() {
  const authedUserId = await getAuthedUserId();
  const conversations = await listDmConversations();
  const conversation = conversations.find((item) => item.user === authedUserId) ?? null;

  if (!conversation) {
    return {
      authed_user_id: authedUserId,
      conversation: null,
      conversations,
      messages: [],
    } satisfies SlackSelfDmResult;
  }

  const history = await slackApi<{ messages?: SlackMessage[] }>("conversations.history", {
    channel: conversation.id,
    limit: "20",
  });

  return {
    authed_user_id: authedUserId,
    conversation,
    conversations,
    messages: history.messages ?? [],
  } satisfies SlackSelfDmResult;
}
