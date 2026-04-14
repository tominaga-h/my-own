# Phase 4: my-own 側の実装プラン

> my-task-sync daemon との双方向同期を実現するために、my-own 側で必要な変更をまとめる。

## 設計方針（決定事項）

| 項目 | 決定 |
|------|------|
| task_number の採番元 | **SQLite が唯一の採番元**。Neon の `task_number` は sync daemon 経由で書き込まれる |
| Web 作成タスクの番号 | 作成直後は `task_number = NULL`。sync daemon が SQLite に INSERT → 採番 → Neon に書き戻し |
| 競合解決 | `updated_at` ベースの Last-Write-Wins (LWW)。行単位 |
| 認証 | 既存の `Authorization: Bearer API_KEY` パターンを踏襲 |

## 現状

- `tasks` テーブル: `id`, `userId`, `title`, `status`, `source`, `important`, `projectId`, `due`, `doneAt`, `createdAt`, `updatedAt`
- `task_reminds` テーブル: `id`, `taskId`, `remindAt`
- `task_notes`, `task_links` 中間テーブル: スキーマのみ存在、API 未実装
- `GET /api/tasks`: 一覧取得のみ（`listTasks`）
- Tasks UI (`app/tasks/`): 読み取り専用

## Step 1: tasks テーブルに task_number カラム追加

### スキーマ変更 (`db/schema.ts`)

```typescript
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  taskNumber: integer("task_number"),  // 追加
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("open"),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  source: text("source").notNull().default("cli"),
  important: boolean("important").notNull().default(false),
  due: date("due"),
  doneAt: date("done_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("tasks_user_id_idx").on(table.userId),
  projectIdIdx: index("tasks_project_id_idx").on(table.projectId),
  statusCheck: check("tasks_status_check", sql`${table.status} in ('open', 'done', 'closed')`),
  userTaskNumberUnique: unique("tasks_user_task_number_unique").on(table.userId, table.taskNumber),
}));
```

### マイグレーション

```bash
npm run db:generate
npm run db:migrate
```

### 既存データへの対応

現在 Neon に入っているタスクは SQLite からマイグレーション済み（`task-migration.ts`）で、元の SQLite `id` が Neon `id` に対応している。`task_number = id` で初期値を埋める:

```sql
UPDATE tasks SET task_number = id WHERE task_number IS NULL;
```

Neon の task_number 用シーケンスは不要（sync daemon が SQLite の autoincrement に基づいて書き込むため）。

## Step 2: Tasks CRUD API

既存の `POST /api/notes` パターンを踏襲して CRUD を追加。

### POST /api/tasks（タスク作成）

Web から作成するタスク。`task_number = NULL` で保存し、sync daemon の採番を待つ。

```
POST /api/tasks
Body: { title, projectId?, due?, important? }
Response: 201 { task: { id, taskNumber: null, title, status: "open", ... } }
```

`lib/api-data.ts` に追加:

```typescript
export async function createTask(userId: string, input: {
  title: string;
  projectId?: number | null;
  due?: string | null;
  important?: boolean;
}) {
  const trimmed = input.title.trim();
  if (!trimmed) throw new Error("タイトルが空です");

  const [row] = await db
    .insert(tasks)
    .values({
      userId,
      title: trimmed,
      status: "open",
      source: "web",
      projectId: input.projectId ?? null,
      due: input.due ?? null,
      important: input.important ?? false,
    })
    .returning();

  return row;
}
```

### PUT /api/tasks/[id]（タスク更新）

```
PUT /api/tasks/:id
Body: { title?, status?, projectId?, due?, doneAt?, important? }
Response: 200 { task: { ... } }
```

`updatedAt` を必ず現在時刻に更新する（LWW の判定基準）。

`status` を `done` に変更する際、`doneAt` が未指定なら今日の日付を自動設定する。

### DELETE /api/tasks/[id]（タスク削除）

```
DELETE /api/tasks/:id
Response: 200 { ok: true }
```

実際には物理削除。task_reminds は `ON DELETE CASCADE` で連動。

## Step 3: Sync 用 API エンドポイント

sync daemon が使う専用エンドポイント。認証は同じ `Bearer API_KEY`。

### GET /api/sync/tasks/unsynced

`task_number` が NULL のタスクを返す。sync daemon の pull_unsynced ステップで使用。

```
GET /api/sync/tasks/unsynced
Response: 200 { tasks: [{ id, title, status, source, ... }] }
```

### PATCH /api/sync/tasks/[id]/number

sync daemon が SQLite で採番した `task_number` を Neon に書き戻す。

```
PATCH /api/sync/tasks/:id/number
Body: { taskNumber: 151 }
Response: 200 { ok: true }
```

ユニーク制約違反時は `409 Conflict` を返す。

### GET /api/sync/tasks/changes

指定時刻以降に更新されたタスクを返す（`task_number` IS NOT NULL のもの）。

```
GET /api/sync/tasks/changes?since=2026-04-12T00:00:00Z
Response: 200 { tasks: [...], serverTime: "2026-04-12T12:00:00Z" }
```

`serverTime` を返すことで、sync daemon が次回の `since` に使える。

### GET /api/sync/tasks/by-number/[num]

`task_number` でタスクを検索。push 時の存在確認に使用。

```
GET /api/sync/tasks/by-number/42
Response: 200 { task: { ... } }   or   404 { error: "not found" }
```

### POST /api/sync/tasks/push

sync daemon からの一括 push。新規作成 + 更新を1リクエストで処理する。個別にリクエストするより効率的。

```
POST /api/sync/tasks/push
Body: {
  tasks: [{
    taskNumber: 150,
    title: "買い物",
    status: "open",
    source: "cli",
    projectName: "personal",
    due: "2026-04-15",
    doneAt: null,
    important: false,
    updatedAt: "2026-04-12T10:05:00Z",
    createdAt: "2026-04-12T10:00:00Z",
    reminds: ["2026-04-14"]
  }]
}
Response: 200 {
  results: [
    { taskNumber: 150, action: "created", neonId: 42 },
    { taskNumber: 151, action: "updated", neonId: 43 },
    { taskNumber: 152, action: "skipped_newer", neonId: 44 }
  ]
}
```

各タスクについて:
- Neon に `task_number` が存在しない → INSERT（`action: "created"`）
- 存在し、push 側の `updatedAt` が新しい → UPDATE（`action: "updated"`）
- 存在し、Neon 側の `updatedAt` が新しいか同じ → スキップ（`action: "skipped_newer"`）

`projectName` は `projects` テーブルから `project_id` を解決する（存在しなければ作成）。

### POST /api/sync/tasks/pull-updates (代替案)

`GET /api/sync/tasks/changes` で十分だが、レスポンスに reminds も含めて返す:

```
Response: {
  tasks: [{
    id: 42,
    taskNumber: 150,
    title: "買い物",
    status: "done",
    ...,
    reminds: ["2026-04-14"],
    projectName: "personal"
  }],
  serverTime: "..."
}
```

## Step 4: Projects 同期対応

sync daemon は `projectName` (文字列) でプロジェクトを参照する（my-task CLI が文字列ベースのため）。

push API はプロジェクト名から `project_id` を解決する必要がある:

1. `projects` テーブルに該当 `name` + `userId` が存在する → その `id` を使用
2. 存在しない → INSERT して `id` を取得

これは `POST /api/sync/tasks/push` 内で処理する。

## Step 5: Task Reminds 同期対応

push API でタスクと一緒に reminds も受け取る。

push 処理内で:
1. 既存の `task_reminds` を該当 `task_id` で全削除
2. 新しい reminds を INSERT

pull (changes) 応答にも reminds を含める。

## Step 6: Web UI タスク作成・編集

Phase 4 の scope に含めるか要検討だが、sync を活かすために最低限のタスク作成 UI が必要。

### 作成フォーム

`app/tasks/` ページに作成フォームを追加。フィールド:
- title（必須）
- project（プルダウン）
- due（日付ピッカー）
- important（チェックボックス）

作成後は `mutate('/api/tasks')` で一覧を再取得。`task_number` が NULL のタスクは「同期待ち」表示。

### ステータス変更

一覧から直接 `done` / `close` / `reopen` の操作を可能に。

## API 一覧（最終形）

| エンドポイント | メソッド | 用途 | 新規/既存 |
|--------------|---------|------|----------|
| `/api/tasks` | GET | タスク一覧（Web UI 用） | 既存 |
| `/api/tasks` | POST | タスク作成（Web UI 用） | **新規** |
| `/api/tasks/[id]` | PUT | タスク更新（Web UI + sync 共用） | **新規** |
| `/api/tasks/[id]` | DELETE | タスク削除 | **新規** |
| `/api/sync/tasks/unsynced` | GET | task_number=NULL のタスク | **新規** |
| `/api/sync/tasks/[id]/number` | PATCH | task_number 書き戻し | **新規** |
| `/api/sync/tasks/changes` | GET | since 以降の変更 | **新規** |
| `/api/sync/tasks/by-number/[num]` | GET | task_number で検索 | **新規** |
| `/api/sync/tasks/push` | POST | 一括 push（効率化） | **新規** |

## 実装順序

```
1. task_number カラム追加 + マイグレーション
2. 既存データの task_number 初期値設定
3. task-migration.ts の更新（task_number = sqlite.id を設定するように）
4. Tasks CRUD API (POST/PUT/DELETE)
5. Sync 用 API (unsynced, number書き戻し, changes, by-number, push)
6. GET /api/tasks の応答に task_number を含める（既にスキーマに入るので自動）
7. Web UI: タスク作成フォーム + ステータス変更
8. listTasks を task_number 対応に更新（task_number=NULL は「同期待ち」として区別）
```

## 注意事項

- sync 用 API (`/api/sync/*`) は `middleware.ts` で NextAuth から除外する（既存の `/api/tasks` と同様）
- `updatedAt` は更新操作時に必ず `new Date()` を設定すること（LWW の正確性に直結）
- `task_number` の UNIQUE 制約は `(user_id, task_number)` の複合（NULL は複数許容される）
- sync 用 API と Web UI 用 API を `/api/sync/` と `/api/tasks/` で名前空間を分けることで、将来の変更影響を局所化する
