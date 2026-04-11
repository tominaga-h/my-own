# my-task CLI 統合: スキーマ変更仕様書

## 背景

my-task（Rust CLI）の DB を SQLite → Neon (PostgreSQL) に移行し、my-own と同じ DB を共有する。
my-own 側の `tasks` テーブルに my-task が必要とするカラムを追加し、
`task_reminds` テーブルを新設する。

## 現状のスキーマ差分

### tasks テーブル

| カラム | my-own (現状) | my-task (必要) | 対応 |
|--------|--------------|---------------|------|
| id | SERIAL PK | ✅ | そのまま |
| user_id | UUID NOT NULL | ✅ | そのまま |
| title | TEXT NOT NULL | ✅ | そのまま |
| status | TEXT (open/done/closed) | ✅ | そのまま |
| project_id | INTEGER FK → projects | — | そのまま (my-task は使わない) |
| due | DATE | ✅ | そのまま |
| done_at | DATE | ✅ | そのまま |
| created_at | TIMESTAMPTZ | ✅ | そのまま |
| updated_at | TIMESTAMPTZ | ✅ | そのまま |
| **source** | **なし** | TEXT NOT NULL DEFAULT 'cli' | **追加** |
| **important** | **なし** | BOOLEAN NOT NULL DEFAULT FALSE | **追加** |

### task_reminds テーブル（新規）

| カラム | 型 | 説明 |
|--------|---|------|
| id | SERIAL PK | |
| task_id | INTEGER FK → tasks(id) ON DELETE CASCADE | |
| remind_at | DATE NOT NULL | |

## 変更内容

### 1. tasks テーブルにカラム追加

```sql
ALTER TABLE tasks ADD COLUMN source TEXT NOT NULL DEFAULT 'cli';
ALTER TABLE tasks ADD COLUMN important BOOLEAN NOT NULL DEFAULT FALSE;
```

- `source`: タスクの作成元を示す。`'cli'`（my-task）/ `'web'`（my-own）。
  - CHECK 制約は不要（将来の拡張性を考慮）
- `important`: 重要タスクフラグ。デフォルト FALSE。
- 既存レコードには DEFAULT 値が適用される（既存の my-own タスクは `source = 'cli'` になるが問題なし。必要なら後から `'web'` に UPDATE）

### 2. task_reminds テーブル新設

```sql
CREATE TABLE task_reminds (
    id        SERIAL PRIMARY KEY,
    task_id   INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    remind_at DATE NOT NULL
);

CREATE INDEX idx_task_reminds_task_id ON task_reminds(task_id);
CREATE INDEX idx_task_reminds_remind_at ON task_reminds(remind_at);
```

### 3. Drizzle スキーマ更新 (db/schema.ts)

`tasks` テーブルに追加:

```typescript
source: text("source").notNull().default("cli"),
important: boolean("important").notNull().default(false),
```

`taskReminds` テーブルを新設:

```typescript
export const taskReminds = pgTable(
  "task_reminds",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    remindAt: date("remind_at").notNull(),
  },
  (table) => ({
    taskIdIdx: index("task_reminds_task_id_idx").on(table.taskId),
    remindAtIdx: index("task_reminds_remind_at_idx").on(table.remindAt),
  }),
);
```

### 4. Drizzle マイグレーション生成・適用

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## project の扱い

my-own は `project_id` (INTEGER FK → projects) でプロジェクトを管理する。
my-task CLI は `project` を TEXT として扱ってきた（SQLite 時代）。

PostgreSQL 統合後の方針:
- my-task は `project_id` を直接使わない。`project_id IS NULL` のタスクを対象とする。
- my-task の `--project` オプションは、my-own の `projects` テーブルを検索し `project_id` に変換する。
  → これは将来の拡張。初期実装では project_id は NULL のまま。

## my-task 側の対応 (参考)

my-task (Rust) 側では `src/db/postgres.rs` の SQL を以下のように調整する:
- SELECT に `source`, `important` を含める
- INSERT に `source = 'cli'` を含める
- `project` TEXT の代わりに `project_id` を使うか、NULL のまま運用する

## 影響範囲

- my-own の既存機能への影響: なし（追加カラムは DEFAULT 値あり、既存クエリに影響しない）
- task_notes, task_links: 変更なし
- my-own の UI: `source` / `important` の表示は将来対応
