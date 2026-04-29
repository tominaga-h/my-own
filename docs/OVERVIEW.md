# my-own 要件定義書

## 概要

個人の情報を一元管理する統合Webアプリケーション。
Slackの自分宛DMからメモとリンクを自動収集し、タスク・メモ・リンクを相互に紐付けて管理する。

## 技術スタック

| 項目 | 技術 |
|------|------|
| フロントエンド / バックエンド | Next.js (TypeScript) |
| ホスティング | Vercel |
| データベース | Neon (PostgreSQL) |
| 認証 | NextAuth.js (GitHubログイン) |
| 定期実行 | Vercel Cron |
| 外部連携 | Slack API (自分宛DM取得) |

## エンティティ

全データはアプリケーションレベルの認可により保護し、認証されたユーザーのみが自身のデータにアクセス可能とする。Neon のマネージドPostgreSQLを利用し、各テーブルは `user_id` を持ち、アプリ層で `session.user.id` と一致する行のみを扱う。

### projects

全エンティティ共通のグルーピング単位。

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| id | serial | PK | |
| user_id | uuid | FK, NOT NULL | auth.users のID (RLS用) |
| name | text | NOT NULL | プロジェクト名 (user_idと複合ユニーク) |
| created_at | timestamptz | NOT NULL | 作成日時 |

### notes

テキスト主体のメモ。

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| id | serial | PK | |
| user_id | uuid | FK, NOT NULL | auth.users のID (RLS用) |
| body | text | NOT NULL | メモ本文 |
| source | text | NOT NULL | `'slack'` or `'manual'` (default: `'manual'`) |
| slack_ts | text | | Slackメッセージのタイムスタンプ |
| project_id | int | | FK → projects |
| created_at | timestamptz | NOT NULL | 作成日時 |
| updated_at | timestamptz | NOT NULL | 更新日時 |

### links

URL主体のリンク。

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| id | serial | PK | |
| user_id | uuid | FK, NOT NULL | auth.users のID (RLS用) |
| url | text | NOT NULL | URL |
| title | text | | リンクタイトル |
| description | text | | 説明・補足テキスト |
| source | text | NOT NULL | `'slack'` or `'manual'` (default: `'manual'`) |
| slack_ts | text | | Slackメッセージのタイムスタンプ |
| project_id | int | | FK → projects |
| created_at | timestamptz | NOT NULL | 作成日時 |
| updated_at | timestamptz | NOT NULL | 更新日時 |

### tasks (my-task-sync 経由)

タスクは Neon に保持しない。 my-task の SQLite (`~/Library/Application Support/my-task/tasks.db`) を **真実の源** とし、my-own は my-task-sync HTTP サーバ (`localhost:3333` / Vercel 本番では ngrok 公開 URL) 経由で読み書きする。

DTO の構造は [`MY_TASK_SYNC_INTEGRATION.md`](MY_TASK_SYNC_INTEGRATION.md) を参照。主なフィールド:

| フィールド | 型 | 説明 |
|-----------|-----|------|
| taskNumber | number | SQLite rowid (サーバー採番、クライアントは触らない) |
| title | string | タスク名 |
| status | string | `'open'` / `'done'` / `'closed'` |
| source | string | `'cli'` (my-task) / `'web'` (my-own) |
| projectName | string \| null | プロジェクト名 (my-task-sync 側で名前→id 解決) |
| due | string \| null | `YYYY-MM-DD` |
| doneAt | string \| null | `YYYY-MM-DD` |
| important | boolean | 重要フラグ |
| reminds | string[] | 通知日 (`YYYY-MM-DD` の配列) |
| createdAt / updatedAt | string | RFC 3339 datetime (UTC) |

タスク↔ノート / リンクの紐付けのみ Neon の `task_notes` / `task_links` 中間テーブルで管理する。`task_number` は my-task-sync 側 rowid を保持するだけで FK 制約は張れないため、整合性は同期処理で別途担保する。

### sync_states (システム管理用)

外部サービス等との同期カーソルやシステム状態を管理するKVS。

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| id | serial | PK | |
| user_id | uuid | FK, NOT NULL | auth.users のID |
| key | text | UNIQUE, NOT NULL | 例: `'slack_last_ts'` |
| value | text | NOT NULL | 最後に取得したタイムスタンプ等の値 |
| updated_at | timestamptz | NOT NULL | 更新日時 |

## リレーション (中間テーブル)

各エンティティの多対多の紐付けは以下の中間テーブルで管理する。（複合主キーにより重複を防止）

| テーブル名 | カラム1 (PK/FK) | カラム2 (PK/FK) | その他 |
| :--- | :--- | :--- | :--- |
| **note_links** | `note_id` (int) | `link_id` (int) | `created_at` (timestamptz) |
| **task_notes** | `task_number` (int, my-task-sync rowid) | `note_id` (int) | `created_at` (timestamptz) |
| **task_links** | `task_number` (int, my-task-sync rowid) | `link_id` (int) | `created_at` (timestamptz) |

> `task_number` は my-task-sync 側で採番される rowid。Neon に対応する `tasks` テーブルが存在しないため FK 制約は張れない。

## Slack同期

- **対象**: 自分→自分のDMのみ（スレッドは無視する）
- **同期の方向**: Slack → my-own への一方向（Inboxとしての利用）。Slack側での編集(`message_changed`)・削除(`message_deleted`)イベントには追従しない。
- **振り分けルール**:
  - URLを含まない投稿 → **Note** として登録
  - URLを含む投稿 → **Link** として登録 (URL以外のテキストは `description` に格納。Slack APIのペイロードを利用し、可能ならOGPタイトルも取得)
- **カーソル管理**: `sync_states` テーブルの `slack_last_ts` を参照し、それ以降の差分のみをAPIで取得。取得完了後に同レコードを最新のタイムスタンプで更新する。
- **実行**: Vercel Cron による定期実行。
- **セキュリティ**: API Endpointは `CRON_SECRET` で保護し、DB書き込みはサーバーサイド（Route Handler/Server Action）から Neon 接続を用いて実施する。

## 開発フェーズ

### Phase 1: 基盤 + Auth + Slack同期 (完了)

- Neon にテーブル・中間テーブルの作成（アプリ層で認可）
- GitHubログイン (NextAuth.js) の設定
- Next.js プロジェクトセットアップ + Vercelデプロイ
- Slack API で自分DMの差分を取得する Cron 用 API Route (CRON_SECRET保護)
- Vercel Cron で定期実行し、DBに保存 + `sync_states` 更新

### Phase 2: 閲覧UI (完了)

- ログイン画面、Note / Link 一覧・詳細画面、密度の高い一覧ビュー、検索・フィルタ

### Phase 3: 手動CRUD + リレーション (進行中)

- Note / Link の新規作成・編集・削除
- 詳細画面・編集画面で関連アイテムを紐付けるUI（中間テーブルへの操作）
- 詳細画面に関連アイテム表示

### Phase 4: Task統合 (完了)

採用したアプローチは「**my-task は SQLite のまま維持し、my-task-sync (Rust 製 axum HTTP サーバ) を仲介層に置く**」。my-own は Neon にタスクを保持せず、my-task-sync REST API 経由で読み書きする。my-task-sync は Phase 1 (REST 骨格 / 5 endpoints) と Phase 2 (ngrok 自動起動 + `/api/status`) を完了し、本番運用中。

実装済み:
- my-task-sync を経由した Task の CRUD (`GET/POST/PATCH /api/tasks`, `GET /api/tasks/:n`)
- Project の CRUD (`GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id`)
- my-own 側 `lib/my-task-sync.ts` HTTP クライアント + Route Handler の `/api/tasks*` / `/api/projects*` 委譲
- ngrok サブプロセス自動起動による Vercel ↔ ローカル疎通
- `/api/status` (運用診断用、認証不要)
- Neon の中間テーブル `task_notes` / `task_links` (FK なし、`task_number` は my-task-sync rowid を保持)

詳細は [`MY_TASK_SYNC_INTEGRATION.md`](MY_TASK_SYNC_INTEGRATION.md) と [`SETUP_GUIDE.md`](SETUP_GUIDE.md)。

### Phase 5: 拡張

- タグ機能
- Slack投稿にマーカー (`#task-10` 等) でリレーション自動生成
- タスク↔ノート/リンク紐付け UI (FK なしのため孤児行 sweep ロジックも同時整備)

## 既存システムとの関係

- **my-task** (Rust CLI + SQLite): タスクの真実の源。CLI は SQLite に直書き
- **my-task-sync** (Rust + axum): macOS 上で常駐し、my-task の SQLite を REST で公開。launchctl + ngrok で公開。my-own から Bearer 認証で叩かれる
- **Slack**: ノート/リンクのデータソース。自分宛 DM への投稿が入力手段となる

## 備考

- プロジェクト名は `my-own` で確定
