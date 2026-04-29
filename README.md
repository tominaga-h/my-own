# my-own

個人の情報を一元管理する統合 Web アプリケーション。Slack の自分宛 DM からメモとリンクを自動収集し、ローカルの `my-task` (Rust CLI) のタスクと相互に紐付けて管理する。

## 関連プロジェクト

my-own は単体では完結せず、以下 3 つのプロジェクトが連動して動く。

| プロジェクト | 言語 | 役割 | データストア |
|--------------|------|------|--------------|
| **my-task** | Rust | ローカルでタスクを add / done / edit する高速 CLI | SQLite (`~/Library/Application Support/my-task/tasks.db`) |
| **my-task-sync** | Rust (axum) | my-task の SQLite を HTTP REST API で公開するバックエンドサーバ。LaunchAgent で常駐し、Vercel から到達するため ngrok を子プロセスで自動起動 | (my-task の SQLite を読み書き) |
| **my-own** (本リポジトリ) | TypeScript (Next.js) | Slack DM からのノート / リンク収集 + タスク統合 Web UI | Neon Postgres + my-task-sync 経由のタスク |

```
┌────────────────────────────┐         ┌────────────────────────────┐
│  my-own (Vercel / local)   │  HTTP   │  my-task-sync (local Mac)  │
│  Next.js + Neon Postgres   │ ──────► │  axum :3333 (LaunchAgent)  │
│  notes / links / projects  │ Bearer  │      │                     │
│                            │ via     │      ▼                     │
│       ▲                    │ ngrok   │  SQLite ◄──── my-task CLI  │
└───────┼────────────────────┘         └────────────────────────────┘
        │ Slack API (Cron)
   ┌────┴─────┐
   │  Slack   │ 自分宛 DM = Inbox
   └──────────┘
```

データの真実の源 (Source of Truth):

- **タスク** → my-task の SQLite (my-own は my-task-sync API 越しに読み書き、Neon にタスクテーブルは持たない)
- **ノート / リンク / プロジェクト (note/link 用)** → Neon Postgres
- **Slack 同期カーソル** → Neon (`sync_states.slack_last_ts`)

my-task-sync が落ちると my-own のタスク系 API は 502 を返すが、ノート / リンクは Neon 直結のため影響を受けない。詳細・セットアップ手順は [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md) を参照。

## ドキュメント

詳細は `docs/` を参照。

| ドキュメント | 内容 |
|--------------|------|
| [`docs/OVERVIEW.md`](docs/OVERVIEW.md) | 要件定義、エンティティ仕様、Slack 同期ルール、開発フェーズ |
| [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md) | my-task / my-task-sync / my-own の関連性とゼロからの環境構築手順 |
| [`docs/MY_TASK_SYNC_INTEGRATION.md`](docs/MY_TASK_SYNC_INTEGRATION.md) | my-task-sync REST API との統合仕様 (DTO / エンドポイント) |
| [`DESIGN.md`](DESIGN.md) | UI / 画面設計 |
| [`CLAUDE.md`](CLAUDE.md) | Claude Code 向けの作業ガイド |

