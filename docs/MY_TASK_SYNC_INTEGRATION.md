# my-own ↔ my-task-sync 統合リファレンス

> my-own が **my-task-sync バックエンドサーバ**
> 経由でタスク / プロジェクトを CRUD する仕組みのリファレンス。
>
> ステータス: **実装完了**。my-task-sync 側 Phase 1 (REST 骨格 + 5 endpoints) /
> Phase 2 (ngrok 自動起動 + `/api/status`) と、my-own 側の Route Handler
> 委譲・SWR 連携・project CRUD UI まで本番運用中。
>
> - my-task-sync 側の API 仕様: [`my-task-sync/docs/API.md`](https://github.com/mad-tmng/my-task-sync/blob/main/docs/API.md)
> - サーバ設計全体: [`my-task-sync/docs/SERVER_DESIGN.md`](https://github.com/mad-tmng/my-task-sync/blob/main/docs/SERVER_DESIGN.md)
> - 環境構築: [`SETUP_GUIDE.md`](SETUP_GUIDE.md)

## 背景

my-task-sync v1 は polling daemon (my-own API を叩いて差分を Neon に push)
として設計されていた。v2 で **HTTP バックエンドサーバ化** し、my-own が
my-task-sync を叩く方向に反転している。

採用したアーキテクチャの帰結:

- my-own は **Neon にタスク系テーブルを持たない**。`tasks` / `task_reminds` /
  task 用 `projects` は my-task-sync (SQLite) が真実の源。
- my-own の `/api/tasks*` / `/api/projects*` Route Handler は **my-task-sync
  HTTP API への薄い委譲**。Bearer 認証・入力 validation・エラーマッピングを
  挟む。
- my-task-sync が落ちている (Mac shut down / ngrok 切断) と my-own のタスク
  系 API は 502 を返す。**オフライン前提** がアーキテクチャに組み込まれている。
- `notes` / `links` / Neon 側 `projects` は従来通り my-own が Neon に直接
  書く (Slack 起点・Web 起点のデータなので仲介不要)。

## アーキテクチャ

```
┌──────────────────────────┐         ┌──────────────────────────┐
│   my-own (Vercel / dev)  │         │ my-task-sync (local Mac) │
│                          │         │                          │
│  app/tasks/page.tsx      │         │  axum :3333              │
│    │ SWR                 │         │  (launchctl LaunchAgent) │
│    ▼                     │         │  + ngrok 子プロセス自動起動 │
│  /api/tasks* (Route)     │  HTTPS  │                          │
│    │ Bearer auth         ├────────►│  GET/POST/PATCH          │
│    │ + MY_TASK_SYNC_URL  │  via    │    /api/tasks(/{n})      │
│    ▼                     │  ngrok  │  GET/POST/PATCH/DELETE   │
│  lib/my-task-sync.ts     │         │    /api/projects(/{id})  │
│                          │         │  GET /api/status         │
│  Neon Postgres           │         │  GET /healthz            │
│   notes / links /        │         │         │                │
│   note_links /           ├────────►│         ▼                │
│   task_notes /           │ http    │    SQLite ◄──── my-task  │
│   task_links /           │ (dev)   │         (Rust CLI)       │
│   projects               │         │                          │
└──────────────────────────┘         └──────────────────────────┘
```

ローカル開発では my-task-sync を `cargo run` し、my-own から `localhost:3333` を直接叩く。Vercel 本番では my-task-sync が起動時に ngrok サブプロセスを spawn し、固定ドメインで HTTPS 公開する。

## 実装範囲 (完了)

| 種別 | 対象 | 内容 |
|------|------|------|
| 環境変数 | `.env.local` / Vercel env | `MY_TASK_SYNC_BASE_URL`, `MY_TASK_SYNC_API_KEY` |
| 追加 | `lib/my-task-sync.ts` | TypeScript 型 + `mtsFetch` + endpoints (`mtsList/Get/Create/Patch Task`, `mtsList/Create/Patch/Delete Project`) + 入力 validation helper |
| 追加 | `lib/mts-error-response.ts` | my-task-sync エラーを Next.js NextResponse に変換 (502 Bad Gateway を含む) |
| 書き換え | `lib/api-data.ts::listTasks` | my-task-sync `GET /api/tasks` 経由 |
| 追加 | `app/api/tasks/route.ts` | GET (status/since/project/limit クエリ) + POST → my-task-sync 委譲 |
| 追加 | `app/api/tasks/[taskNumber]/route.ts` | GET / PATCH 委譲 |
| 追加 | `app/api/projects/route.ts` | GET / POST 委譲 |
| 追加 | `app/api/projects/[id]/route.ts` | PATCH / DELETE 委譲 |
| 更新 | `app/tasks/page.tsx` / `TasksView.tsx` | DTO は `taskNumber` / `projectName` / `reminds` ベース |

> **`notes` / `links` / `note_links` / Neon の `projects` (note/link 用) は引き続き Neon 直 CRUD。** my-task-sync 経由はタスク系のみ。

## 設定変更

### env vars

`.env.example` に追記:

```bash
# my-task-sync (ローカル: localhost / Vercel 本番: ngrok 公開 URL)
MY_TASK_SYNC_BASE_URL=http://localhost:3333
MY_TASK_SYNC_API_KEY=replace_me
```

- **ローカル開発**: `http://localhost:3333`
- **Vercel 本番**: `https://<ngrok-domain>.ngrok-free.dev`
- `MY_TASK_SYNC_API_KEY` は my-task-sync 側の `[server].api_key` と同じ値

### 解決ヘルパ (推奨実装)

```ts
// lib/my-task-sync.ts
export function mtsConfig() {
  const baseUrl = process.env.MY_TASK_SYNC_BASE_URL;
  const apiKey = process.env.MY_TASK_SYNC_API_KEY;
  if (!baseUrl) throw new Error("MY_TASK_SYNC_BASE_URL is required");
  if (!apiKey) throw new Error("MY_TASK_SYNC_API_KEY is required");
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
}
```

## TypeScript 型定義

my-task-sync の DTO を TypeScript に写したもの。`lib/my-task-sync.ts` に
置く想定。

```ts
// lib/my-task-sync.ts

export type TaskStatus = "open" | "done" | "closed";

/** `GET /api/tasks` 要素 / `POST`・`PATCH`・`GET /:n` の `task` フィールド */
export type TaskDto = {
  taskNumber: number;       // = SQLite rowid (サーバー採番、クライアントからは触らない)
  title: string;
  status: TaskStatus;
  source: string;           // "cli" / "web" / その他
  projectName: string | null;
  due: string | null;       // YYYY-MM-DD
  doneAt: string | null;    // YYYY-MM-DD
  important: boolean;
  updatedAt: string;        // RFC 3339 datetime (UTC)
  createdAt: string;        // RFC 3339 datetime (UTC)
  reminds: string[];        // YYYY-MM-DD の配列
};

export type TaskListResponse = {
  tasks: TaskDto[];
  serverTime: string;       // 次回の ?since= に投げ戻せる RFC 3339 datetime
};

export type TaskResponse = {
  task: TaskDto;
  serverTime: string;
};

export type ProjectDto = { id: number; name: string };
export type ProjectListResponse = {
  projects: ProjectDto[];
  serverTime: string;
};

/** POST body。`taskNumber` は絶対に含めない (server が rowid を採番する) */
export type TaskCreateBody = {
  title: string;
  status: TaskStatus;
  source: string;
  projectName?: string | null;
  due?: string | null;
  doneAt?: string | null;
  important?: boolean;
  updatedAt: string;        // 必須
  createdAt: string;        // 必須
  reminds?: string[];       // default []
};

/** PATCH body。全フィールド optional。`null` 明示でクリア。
 *  `updatedAt` を送らないと my-task-sync 側で `Utc::now()` に auto-bump される */
export type TaskPatchBody = Partial<{
  title: string;
  status: TaskStatus;
  source: string;
  projectName: string | null;
  due: string | null;
  doneAt: string | null;
  important: boolean;
  updatedAt: string;
  createdAt: string;
  reminds: string[];        // null 不許可 (400)
}>;
```

## HTTP クライアント (my-task-sync 専用ラッパ)

既存 `lib/api-client.ts` は自前 `/api/*` 向けで、my-task-sync 呼び出しに
は専用ラッパを作ったほうが型安全。

```ts
// lib/my-task-sync.ts (続き)

type MtsError = {
  status: number;
  error: string;           // my-task-sync の {"error": "..."} を解いた値
};

async function mtsFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { baseUrl, apiKey } = mtsConfig();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const resp = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    // Route Handler (server) から呼ぶので cache: "no-store" が安全
    cache: "no-store",
  });

  if (!resp.ok) {
    let errorMsg = `HTTP ${resp.status}`;
    try {
      const body = await resp.json();
      if (typeof body?.error === "string") errorMsg = body.error;
    } catch {
      /* JSON でないレスポンスは status 文字列のまま */
    }
    const err: MtsError = { status: resp.status, error: errorMsg };
    throw err;
  }
  return resp.json() as Promise<T>;
}

// ---- endpoints ----

export function mtsListTasks(params?: {
  status?: TaskStatus;
  since?: string;          // RFC 3339 datetime
  project?: string;
  limit?: number;
}): Promise<TaskListResponse> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.since) q.set("since", params.since);
  if (params?.project) q.set("project", params.project);
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  const query = q.toString();
  return mtsFetch<TaskListResponse>(`/api/tasks${query ? `?${query}` : ""}`);
}

export function mtsGetTask(taskNumber: number): Promise<TaskResponse> {
  return mtsFetch<TaskResponse>(`/api/tasks/${taskNumber}`);
}

export function mtsCreateTask(body: TaskCreateBody): Promise<TaskResponse> {
  return mtsFetch<TaskResponse>(`/api/tasks`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function mtsPatchTask(
  taskNumber: number,
  body: TaskPatchBody,
): Promise<TaskResponse> {
  return mtsFetch<TaskResponse>(`/api/tasks/${taskNumber}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function mtsListProjects(): Promise<ProjectListResponse> {
  return mtsFetch<ProjectListResponse>(`/api/projects`);
}
```

### project endpoints

```ts
export function mtsListProjects(): Promise<ProjectListResponse>;
export function mtsCreateProject(body: { name: string }): Promise<ProjectResponse>;
export function mtsPatchProject(id: number, body: { name: string }): Promise<ProjectResponse>;
export function mtsDeleteProject(id: number): Promise<void>;
```

### クライアント側で守るべき制約

- **`taskNumber` を POST / PATCH の body に入れない** → 400
- **未知フィールドを送らない** (例: `reminders` は typo → 400)。`TaskCreateDto` は server 側 `deny_unknown_fields`
- **`since` は RFC 3339 datetime** (`YYYY-MM-DD` 単独は 400)。レスポンスの `serverTime` をそのまま次回 `since` に投げ戻す
- **`reminds: null` を送らない** → 400。未送信なら "既存保持"
- **PATCH `updatedAt` を送らないと server 側で `Utc::now()` に auto-bump**

## 採用済みの設計判断

### Neon にタスク系テーブルを置かない

Neon にはタスク系を保持しない (採用案 a)。`lib/task-migration.ts` は v1 用に存在していたが削除済み。`db/schema.ts` の `tasks` / `task_reminds` / 旧 task 用 projects も既に削除されており、残っているのは `task_notes` / `task_links` (FK なし) のみ。

オフライン閲覧が必要になった場合のみ read-through キャッシュ案 (b) を再検討する。

### `userId` は my-task-sync には送らない

my-own は `requireApiUserId(request)` で API 認証を維持しつつ、my-task-sync は単一ユーザー前提のままにしている。マルチユーザー化したくなったら my-task-sync インスタンスをユーザーごとに立てる方向で検討する。

### オフライン時の UX

my-task-sync が落ちている / ngrok 切断時、Route Handler は 502 を返す。`/tasks` 画面はエラーバナーを出して読み取り専用にフォールバックする。ノート / リンク系 (Neon 直結) は影響を受けない。

## task_notes / task_links の整合性

Neon に `tasks` テーブルが存在しないため、`task_notes` / `task_links` の `task_number` カラムには FK 制約を張れない。これにより:

- **孤児行**: my-task-sync 側で `my-task rm <n>` などタスクが削除されても、Neon の `task_notes` / `task_links` には `task_number = n` の行が残る
- **整合性管理**: Vercel Cron もしくは同期処理で `task_number` の存在を `GET /api/tasks` 結果と突合し、孤児行を sweep する (Phase 5 タスク)
- **書き込み時ガード**: 紐付けを INSERT する Route Handler では `mtsGetTask(taskNumber)` で存在確認し、404 なら 400 で拒否する

タスク↔ノート/リンク紐付け UI を実装するタイミングで一緒に整備する。

## 開発フロー

ローカル開発:

```bash
# terminal 1: my-task-sync
cd ~/lab/rust/my-task-sync
MY_TASK_SYNC_API_KEY=dev-secret MY_TASK_SYNC_PORT=3333 cargo run --release
# あるいは launchctl で常駐させた状態で動かす

# terminal 2: my-own
cd ~/lab/typescript/REACT/my-own
# .env.local
#   MY_TASK_SYNC_BASE_URL=http://localhost:3333
#   MY_TASK_SYNC_API_KEY=dev-secret
npm run dev   # → http://localhost:3000
```

Vercel 本番では `MY_TASK_SYNC_BASE_URL` を `https://<ngrok-domain>.ngrok-free.dev` に向ける。my-task-sync 側で `[ngrok].domain` を設定すると起動時に `ngrok http 3333 --domain <domain>` が自動で立ち上がるため、my-own 側のコード変更は不要。

### 結合テスト checklist

- [ ] `my-task add "…"` (CLI) → my-own `/tasks` で即時表示
- [ ] my-own で新規作成 → `my-task ls` で表示
- [ ] 両側で同一タスクを編集 → `updatedAt` が新しい方が勝つ (後勝ち)
- [ ] `my-task done <n>` → my-own で status=done 反映
- [ ] my-own の `/tasks` プロジェクト管理モーダルで新規 project → `my-task projects` に出現
- [ ] my-task-sync を Ctrl-C で落とす → my-own `/tasks` が 502 / エラー表示
- [ ] my-task-sync 再起動 → my-own が回復
- [ ] my-task-sync の `/api/status` (認証不要) で SQLite path / ngrok URL を確認
