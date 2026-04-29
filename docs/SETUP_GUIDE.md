# my-own セットアップガイド

このドキュメントは以下の 2 つを扱う。

1. **my-own / my-task / my-task-sync の関連性** — 3 つのプロジェクトがどう連動するか
2. **my-own の環境構築手順** — my-task と my-task-sync のセットアップを含む、ゼロからの開発環境立ち上げ手順

関連ドキュメント:

- [`OVERVIEW.md`](OVERVIEW.md) — my-own の要件定義 / エンティティ仕様

> my-task-sync は v2 (HTTP バックエンドサーバ) の Phase 1 + Phase 2 を実装完了し、本番運用中。my-own 側の `/api/tasks*` / `/api/projects*` は Neon 直結ではなく my-task-sync REST API への委譲となっている。

---

## 1. プロジェクト関連図

### 役割分担

| プロジェクト           | 言語         | 役割                                             | データストア                                                    |
| ---------------- | ---------- | ---------------------------------------------- | --------------------------------------------------------- |
| **my-task**      | Rust       | ローカルでタスクを add / done / edit する高速 CLI           | SQLite (`~/Library/Application Support/my-task/tasks.db`) |
| **my-task-sync** | Rust       | my-task の SQLite を HTTP REST APIで公開するバックエンドサーバ | (my-task の SQLite を読み書き)                                  |
| **my-own**       | TypeScript | Slack DM からのメモ / リンク収集 + タスク統合 Web UI          | Neon Postgres + my-task-sync 経由のタスク                       |

### データフロー

```
┌────────────────────────────┐         ┌────────────────────────────┐
│  my-own (Vercel / local)   │         │  my-task-sync (local Mac)  │
│                            │  HTTP   │                            │
│  app/tasks/page.tsx        │  Bearer │  axum :3333                │
│      │                     │  auth   │  (LaunchAgent)             │
│      ▼                     ├────────►│      │                     │
│  /api/tasks (Route)        │  via    │      ▼                     │
│      │                     │  ngrok  │  SQLite ◄──── my-task CLI  │
│      ▼                     │         │         (Rust)             │
│  lib/my-task-sync.ts       │         │                            │
│                            │         │                            │
│  Neon Postgres             │         │                            │
│  (notes / links /          │         │                            │
│   projects /               │         │                            │
│   note_links / ...)        │         │                            │
└────────────────────────────┘         └────────────────────────────┘
        ▲
        │ Slack API (Cron)
        │
   ┌────┴─────┐
   │  Slack   │ 自分宛 DM = Inbox
   └──────────┘
```

### なぜこの構成か

- **my-task は SQLite のまま維持する** — ネットワーク越しの DB 接続は CLI 起動を遅くし、Rust の高速性が活かせない。
- **my-task-sync を仲介層に置く** — Web (my-own) からタスクを読み書きするには、ローカル SQLite を HTTP で公開する必要がある。launchctl で常駐させ、`localhost:3333` で待ち受ける。
- **Vercel から到達するには ngrok** — my-task-sync が起動時に `ngrok http` サブプロセスを spawn し、固定ドメインで公開する (実装済み)。
- **タスク以外 (notes / links / projects) は Neon に直接書く** — Web 起点で発生するデータなので仲介不要。

### データの真実の源 (Source of Truth)

| データ種別 | 真実の源 | 備考 |
|------------|----------|------|
| タスク (tasks, reminds, projects) | **my-task の SQLite** | my-own は my-task-sync API 経由でアクセスする。Neon にタスク系テーブルは持たない |
| ノート (notes) | **Neon Postgres** | Slack DM もしくは my-own の Web UI から直接書き込む |
| リンク (links) | **Neon Postgres** | 同上 |
| プロジェクト (projects) | Neon (note/link 用) と SQLite (task 用) で**別々** | タスクのプロジェクトは my-task-sync 経由 (`projectName: string`)。ノート/リンクのプロジェクトは Neon の `projects` テーブル (FK で `project_id`) |
| Slack 同期カーソル | Neon (`sync_states.slack_last_ts`) | |

### オフライン挙動

my-task-sync が落ちている (Mac shut down / ngrok 切断) と、my-own のタスク系 API は 502 を返す。notes / links は Neon 直結のため影響を受けない。

---

## 2. 環境構築手順

セットアップは **下から積み上げる**。`my-task` → `my-task-sync` → `my-own` の順で進める。

### 2-1. 前提

- macOS (my-task-sync が `launchctl` を使う)
- Rust toolchain 1.75+ (`rustup` 推奨)
- Node.js 20+ / npm
- Neon アカウント (Postgres) と空のプロジェクト 1 つ
- GitHub OAuth App (NextAuth 用)
- Slack User Token (`xoxp-...`) — 自分宛 DM の `im:history` 権限
- (Vercel 本番から到達したい場合) ngrok アカウント + 予約ドメイン

---

### 2-2. my-task のセットアップ

```bash
# Homebrew でインストール (推奨)
brew tap tominaga-h/tap
brew install tominaga-h/tap/my-task

# あるいはソースから
git clone https://github.com/mad-tmng/my-task.git ~/lab/rust/my-task
cd ~/lab/rust/my-task
cargo install --path .

# 動作確認
my-task add "セットアップ確認用タスク"
my-task list
```

SQLite は自動で `~/Library/Application Support/my-task/tasks.db` (XDG では `~/.local/share/my-task/tasks.db`) に作られる。`MY_TASK_DATA_FILE` 環境変数でパスを上書きできる。

> このパスは次の my-task-sync が読みに行く先。

---

### 2-3. my-task-sync のセットアップ

#### (1) ビルド

```bash
git clone https://github.com/mad-tmng/my-task-sync.git ~/lab/rust/my-task-sync
cd ~/lab/rust/my-task-sync
cargo build --release
# → target/release/my-task-sync
```

#### (2) 設定ファイル

```bash
mkdir -p ~/.config/my-task-sync
cp config.example.toml ~/.config/my-task-sync/config.toml
$EDITOR ~/.config/my-task-sync/config.toml
```

最低限 `[server].api_key` を設定する。**この値は後で my-own の `MY_TASK_SYNC_API_KEY` と一致させる**。

```toml
[server]
port    = 3333
api_key = "dev-secret-please-change"

# Vercel から到達する場合は ngrok ドメインを設定
# [ngrok]
# domain = "your-reserved.ngrok-free.dev"
```

#### (3) ローカル動作確認

```bash
# フォアグラウンド起動 (terminal をひとつ占有)
MY_TASK_SYNC_API_KEY=dev-secret-please-change cargo run --release

# 別ターミナルで疎通確認
curl localhost:3333/healthz
# → "ok"

curl -H "Authorization: Bearer dev-secret-please-change" \
  localhost:3333/api/tasks | jq
# → my-task で追加したタスクが返る
```

#### (4) LaunchAgent として常駐させる (任意)

開発中はフォアグラウンド起動でも構わないが、Vercel から常時叩く運用にするなら登録する。

```bash
cp target/release/my-task-sync /usr/local/bin/
cp com.my-task-sync.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.my-task-sync.plist

launchctl list | grep my-task-sync   # 状態確認
tail -f /tmp/my-task-sync.out.log    # ログ
```

停止は `launchctl unload`、再起動は unload → load。

#### (5) ngrok 公開 (Vercel 本番から到達したい場合)

Vercel デプロイ済の my-own から到達するには、my-task-sync が ngrok 経由で公開されている必要がある。

```bash
brew install ngrok
ngrok config add-authtoken <YOUR_TOKEN>
# https://dashboard.ngrok.com/cloud-edge/domains で予約ドメインを作る
```

`config.toml` に `[ngrok].domain = "..."` を書くと、my-task-sync 起動時に `ngrok http 3333 --domain <domain>` が自動で起動する (子プロセス管理 + Drop ガード + graceful shutdown 時 killpg 済み)。`/api/status` (認証不要) で SQLite path / ngrok URL を確認できる。

---

### 2-4. Neon Postgres のセットアップ

1. https://console.neon.tech で空のプロジェクトを作成
2. Connection string (`postgresql://user:password@.../dbname`) を控える
3. これを my-own の `DATABASE_URL` にセットする (後述)

スキーマは Drizzle のマイグレーションで適用するので、この時点では空 DB で OK。

---

### 2-5. my-own のセットアップ

#### (1) クローンと依存インストール

```bash
git clone <my-own repo> ~/lab/typescript/REACT/my-own
cd ~/lab/typescript/REACT/my-own
npm install
```

#### (2) `.env.local` の作成

```bash
cp .env.example .env.local
$EDITOR .env.local
```

埋める値:

| 変数 | 値 |
|------|------|
| `NEXTAUTH_URL` | `http://localhost:3000` (ローカル時) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` で生成 |
| `API_KEY` | my-own の `/api/*` を叩くときの Bearer。任意の長い文字列 |
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub OAuth App から取得 |
| `ALLOWED_GITHUB_LOGIN` | サインインを許可する自分の GitHub username |
| `SLACK_USER_TOKEN` | Slack App で発行した User Token (`xoxp-...`) |
| `CRON_SECRET` | Vercel Cron 用 Bearer。任意の長い文字列 |
| `DATABASE_URL` | Neon の connection string |
| `APP_USER_ID` | 認証なしでローカル開発する間の固定 UUID。`uuidgen` で生成 |
| `MY_TASK_SYNC_BASE_URL` | `http://localhost:3333` (ローカル) / `https://<ngrok>.ngrok-free.dev` (Vercel) |
| `MY_TASK_SYNC_API_KEY` | **2-3 (2) で my-task-sync に設定した api_key と同じ値** |

GitHub OAuth App は https://github.com/settings/developers から作成し、Authorization callback URL に `http://localhost:3000/api/auth/callback/github` を入れる。

#### (3) DB マイグレーション

```bash
npm run db:generate   # schema.ts → migration files
npm run db:migrate    # Neon に apply
npm run db:studio     # ブラウザで Drizzle Studio (任意)
```

#### (4) 起動

```bash
# terminal 1: my-task-sync (まだ起動していなければ)
cd ~/lab/rust/my-task-sync
MY_TASK_SYNC_API_KEY=dev-secret-please-change cargo run --release

# terminal 2: my-own
cd ~/lab/typescript/REACT/my-own
npm run dev
# → http://localhost:3000
```

#### (5) 動作確認

- http://localhost:3000/notes — Slack 同期前は空
- http://localhost:3000/links — 同上
- http://localhost:3000/tasks — my-task で追加したタスクが見える (my-task-sync 経由)
- 一度 Slack 同期を走らせる:
  ```bash
  curl -X POST http://localhost:3000/api/dev/slack/sync
  ```
  自分宛 DM がノート / リンクに振り分けられて DB に入る。

---

### 2-6. 結合テスト チェックリスト

ローカルで一通り動くことを確認する:

- [ ] `my-task add "test"` (CLI) → my-own `/tasks` で即時表示される
- [ ] my-own のタスクページから新規作成 → `my-task ls` で見える
- [ ] `my-task done <n>` → my-own で status=done に変わる
- [ ] my-task-sync を Ctrl-C で落とす → my-own `/tasks` が 502 / エラー表示
- [ ] my-task-sync を再起動 → my-own が回復
- [ ] Slack 自分宛 DM に「URL を含まないテキスト」を投稿 → `/api/dev/slack/sync` 後に `/notes` に出る
- [ ] Slack 自分宛 DM に URL を投稿 → `/links` に出る (本文が `description` に入る)

---

## 3. Vercel 本番デプロイ時の差分

ローカルから Vercel に上げるときに変える項目だけ。

| 変数 | ローカル | Vercel |
|------|----------|--------|
| `NEXTAUTH_URL` | `http://localhost:3000` | デプロイ後の URL |
| `MY_TASK_SYNC_BASE_URL` | `http://localhost:3333` | `https://<ngrok-domain>.ngrok-free.dev` |
| `MY_TASK_SYNC_API_KEY` | (同じ) | (同じ) |

加えて my-task-sync 側で `[ngrok].domain` を設定し、launchctl 経由で常駐させる。Mac がスリープすると Vercel からタスクが見えなくなるので注意。`/api/status` を Vercel から叩いて疎通確認できる (認証不要)。

Vercel Cron は `vercel.json` に登録された Slack 同期エンドポイントを定期実行する (`CRON_SECRET` で保護)。

---

## 4. トラブルシュート

| 症状 | 原因 / 対処 |
|------|-------------|
| `/tasks` が 502 を返す | my-task-sync が落ちている。`curl localhost:3333/healthz` で確認、`launchctl list | grep my-task-sync` で常駐状態を見る |
| `/tasks` が 401 / "unauthorized" | `MY_TASK_SYNC_API_KEY` が my-task-sync 側の `api_key` と一致していない |
| `/api/dev/slack/sync` が 401 | Slack User Token の権限不足。`im:history`, `im:read`, `users:read` が必要 |
| Drizzle `migrate` が失敗 | `DATABASE_URL` の SSL 設定、Neon プロジェクトの IP 制限を確認 |
| ngrok ドメインが取れない | 無料枠は 1 個まで。既存ドメインを再利用するか、有料プラン |
| my-task で追加したタスクが見えない | my-task-sync が読んでいる SQLite パスが違う可能性。`MY_TASK_DATA_FILE` を両側で揃える |
