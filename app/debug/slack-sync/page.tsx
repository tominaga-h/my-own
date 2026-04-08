import { syncSlackSelfDmToDatabase } from "../../../lib/slack-sync";
import { getMostLikelySelfDmDebug } from "../../../lib/slack";

export const dynamic = "force-dynamic";

export default async function SlackSyncDebugPage() {
  try {
    const debug = await getMostLikelySelfDmDebug();
    const data = await syncSlackSelfDmToDatabase();

    return (
      <main className="page">
        <div className="card">
          <p className="eyebrow">debug</p>
          <h1>Slack sync result</h1>
          <p>DB user: {data.databaseUserId}</p>
          <p>Auth user: {data.authedUserId}</p>
          <p>Fetched messages: {data.fetchedMessages}</p>
          <p>Notes inserted: {data.notesInserted}</p>
          <p>Links inserted: {data.linksInserted}</p>
          <p>Last ts: {data.lastMessageTs ?? "none"}</p>
          <p>Debug messages: {debug.debug.rawMessages.length}</p>
          <pre className="json">{JSON.stringify(debug.debug.rawMessages, null, 2)}</pre>
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
          <h1>Slack sync failed</h1>
          <p>{message}</p>
        </div>
      </main>
    );
  }
}
