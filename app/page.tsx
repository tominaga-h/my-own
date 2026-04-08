export default function Home() {
  return (
    <main className="page">
      <div className="card">
        <p className="eyebrow">my-own</p>
        <h1>Phase 1 initial scaffold</h1>
        <p>
          Next.js と PostgreSQL の土台を先に置いて、ここから
          Auth と Slack 同期を積みます。
        </p>
        <div className="home-links">
          <a href="/links">Links</a>
          <a href="/debug/slack-sync">Slack Sync Debug</a>
        </div>
      </div>
    </main>
  );
}
