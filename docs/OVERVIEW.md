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

### tasks (Phase 4で追加)

タスク管理。既存 my-task (Rust CLI) から統合予定。

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| id | serial | PK | |
| user_id | uuid | FK, NOT NULL | auth.users のID (RLS用) |
| title | text | NOT NULL | タスク名 |
| status | text | NOT NULL | `'open'`, `'done'`, `'closed'` |
| project_id | int | | FK → projects |
| due | date | | 期限 |
| done_at | date | | 完了日 |
| created_at | timestamptz | NOT NULL | 作成日時 |
| updated_at | timestamptz | NOT NULL | 更新日時 |

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
| **task_notes** | `task_id` (int) | `note_id` (int) | `created_at` (timestamptz) |
| **task_links** | `task_id` (int) | `link_id` (int) | `created_at` (timestamptz) |

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

### Phase 1: 基盤 + Auth + Slack同期

- Neon にテーブル・中間テーブルの作成（アプリ層で認可）
- GitHubログイン (NextAuth.js) の設定
- Next.js プロジェクトセットアップ + Vercelデプロイ
- Slack API で自分DMの差分を取得する Cron 用 API Route (CRON_SECRET保護)
- Vercel Cron で定期実行し、DBに保存 + `sync_states` 更新

**ゴール**: セキュアな環境下で、Slackに書いたらDBに溜まる仕組みの完成

### Phase 2: 閲覧UI

- ログイン画面の実装
- Note 一覧・詳細画面
- Link 一覧・詳細画面
- 検索・フィルタ (最低限)

**ゴール**: Slackに書いたらWebで見られる

### Phase 3: 手動CRUD + リレーション

- Note / Link の新規作成・編集・削除
- 詳細画面・編集画面で関連アイテムを紐付けるUI（中間テーブルへの操作）
- 詳細画面に関連アイテム表示

**ゴール**: Web上でメモとリンクを柔軟に管理・結合できる

### Phase 4: Task統合

- tasks テーブルおよび関連中間テーブルの追加
- 既存 my-task (Rust CLI + SQLite) からのマイグレーション or API連携
- Task の CRUD + リレーション
- my-task CLI が my-own API を叩く形への移行

### Phase 5: 拡張

- タグ機能
- CLIからAPI経由で操作
- Slack投稿にマーカー (`#task-10` 等) でリレーション自動生成

## 既存システムとの関係

- **my-task** (Rust CLI + SQLite): Phase 4 まで独立して存続。統合後はCLIがmy-own APIを叩く形を想定
- **Slack**: データソースとして利用。自分DMへの投稿が入力手段となる

## 備考

- プロジェクト名は `my-own` で確定
