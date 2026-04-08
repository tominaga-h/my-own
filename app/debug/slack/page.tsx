import { getMostLikelySelfDm } from "../../../lib/slack";

export const dynamic = "force-dynamic";

export default async function SlackDebugPage() {
  try {
    const data = await getMostLikelySelfDm();

    return (
      <main className="page">
        <div className="card">
          <p className="eyebrow">debug</p>
          <h1>Slack DM fetch</h1>
          <p>Auth user: {data.authed_user_id}</p>
          <p>Conversation: {data.conversation?.id ?? "not found"}</p>
          <p>Fetched messages: {data.messages.length}</p>
          <pre className="json">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <main className="page">
        <div className="card">
          <p className="eyebrow">debug</p>
          <h1>Slack DM fetch failed</h1>
          <p>{message}</p>
        </div>
      </main>
    );
  }
}

