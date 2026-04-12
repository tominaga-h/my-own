# Task #81 — 完全SPA化（データはAPI経由）実装プラン

> 別モデルによる検証用ドキュメント。`my-task #81` の実装プラン。

## Context

現在 `my-own` の 4 つのページ（Home / Notes / Tasks / Links）はすべてサーバーコンポーネントで、`lib/db.ts` 経由で Drizzle から直接 DB を読んでレンダリングしている。Task #81 は「完全 SPA に方針変更。データは API で取得」。目的は:

- ページ遷移やフィルタ操作での再フェッチをクライアント側でコントロールできるようにする
- ブラウザで動く純粋な SPA UI にしてサーバー RTT を減らす
- 将来的にモバイル/別クライアントからも同じ API を叩けるように、データ取得経路を HTTP 境界へ集約する

決定事項（ユーザー確認済み）:

| 項目 | 決定 |
|---|---|
| SPA化の範囲 | 4ページ全部一度に (Home/Notes/Tasks/Links) |
| データフェッチ層 | **SWR** |
| Server Action `createNote` | **`POST /api/notes` に置き換え**（Server Action は削除） |
| 認証 | API key を `Authorization` ヘッダで付与（ブラウザ公開前提の簡易トークン、env 名は `API_KEY`） |

## 現状アーキテクチャ（調査結果サマリ）

### ページ（すべて Server Component、DB 直読み）

| ページ | ファイル | 読むデータ |
|---|---|---|
| Home | `app/page.tsx` | `getRecentNotes`, `getRecentLinks`, `getCollectionStats`, `getLastSyncTime`, `getProjectsWithCounts` |
| Notes | `app/notes/page.tsx` | notes (limit 200) + `syncStates` から lastSyncAt |
| Tasks | `app/tasks/page.tsx` | tasks + taskReminds + projects を join し、`remindsMap` / `projectMap` を構築 |
| Links | `app/links/page.tsx` | links (limit 100) |

### 既存 Client Component
- `app/notes/NotesView.tsx` — props で notes 受け取り、フィルタ/選択は local state
- `app/tasks/TasksView.tsx` — props で tasks + remindsMap + projectMap 受け取り
- `app/components/QuickCapture.tsx` — Server Action `createNote` を `useTransition` 経由で呼ぶ

### 既存 API ルート
- `/api/auth/[...nextauth]` — NextAuth (そのまま)
- `/api/cron` — Slack 同期 cron (そのまま)
- `/api/dev/slack/sync`, `/api/dev/slack/self-dm`, `/api/dev/task-migration` — dev用 (そのまま)

### 依存
- **未インストール**: SWR / React Query / Axios / Zustand など — 追加が必要
- `next-auth`, `drizzle-orm`, `@neondatabase/serverless` はインストール済み

## 方針

1. `app/api/data/*` および `app/api/{notes,tasks,links}/route.ts` に読み取り系 REST エンドポイントを新設し、既存 `lib/queries.ts` とページ内 Drizzle クエリをすべてそこに集約する
2. 各ページ（`page.tsx`）は薄い client component になり、`<PageView />` を呼ぶだけ。`PageView` が `useSWR` で API を叩く
3. サーバー側の認可は API key の検証に変更し、成功時は従来どおり `APP_USER_ID` 固定のデータスコープを使う。API ルートは `Authorization` ヘッダを検証する共通ヘルパー `lib/api-auth.ts` を追加
4. 既存の `NotesView` / `TasksView` は props 受け取り → SWR 呼び出しに書き換え。`QuickCapture` も `fetch('/api/notes', POST)` + `mutate` に書き換え
5. middleware は `/api/data/*`, `/api/notes`, `/api/tasks`, `/api/links` を保護対象から外し、API を pre-auth 前提で呼べるようにする

## 追加/変更するファイル

### 新規 API ルート

| パス | メソッド | 内容 |
|---|---|---|
| `app/api/data/stats/route.ts` | GET | `getCollectionStats()` + `getLastSyncTime()` |
| `app/api/data/recent/route.ts` | GET | `getRecentNotes()` + `getRecentLinks()` |
| `app/api/data/projects/route.ts` | GET | `getProjectsWithCounts()` |
| `app/api/notes/route.ts` | GET (list, `?limit=200`) / POST (create) | 旧 `createNote` を移植 |
| `app/api/tasks/route.ts` | GET | tasks + reminds + projects を 1 レスポンスにまとめて返す |
| `app/api/links/route.ts` | GET (`?limit=100`) | links 一覧 |

各ルートは `export const runtime = 'nodejs'` + `export const dynamic = 'force-dynamic'`。レスポンスは `NextResponse.json(...)`。

### 新規ヘルパー
- `lib/api-auth.ts` — `Authorization` ヘッダを検証し、API key が一致した時だけ処理を継続する。成功時は `APP_USER_ID` を返して既存のクエリに渡す
- `lib/api-client.ts` — SWR 用 fetcher:
  ```ts
  export const fetcher = (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    }).then(r => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    });
  ```
- `app/providers.tsx` に `SWRConfig` を追加（`revalidateOnFocus: false`, 共通 `fetcher` 注入）
- API レスポンスの日付は JSON に乗る ISO 文字列へ正規化し、client 側で `new Date(...)` に戻して扱う

### ページ書き換え（すべて client component 化）

- **`app/page.tsx`** → `'use client'`。`useSWR('/api/data/stats')`, `useSWR('/api/data/recent')`, `useSWR('/api/data/projects')` を並行発火。ローディング/エラー UI を追加。既存の JSX 構造はそのまま流用
- **`app/notes/page.tsx`** → `<NotesView />` に薄くラップ。page 自体からサーバークエリを削除
- **`app/notes/NotesView.tsx`** → props 廃止、`useSWR<{ notes: Note[]; lastSyncAt: string|null }>('/api/notes?limit=200')` に変更。`createNote` 呼び出しを `fetch('/api/notes', { method: 'POST', body: JSON.stringify({ body, projectName }) })` + `mutate('/api/notes?limit=200')` に置き換え。表示時は `new Date(note.postedAt)` / `new Date(lastSyncAt)` を使う
- **`app/tasks/page.tsx` + `app/tasks/TasksView.tsx`** → 同様。`useSWR('/api/tasks')` で `{ tasks, remindsMap, projectMap }` を受け取る
- **`app/links/page.tsx`** → client 化し `useSWR('/api/links?limit=100')` でリスト表示。既存の JSX を流用

### 削除
- `app/notes/actions.ts`（Server Action）— `POST /api/notes` に統合後に削除
- `app/components/QuickCapture.tsx` の `useTransition` + action 呼び出しを `fetch` + `mutate` に置換

### そのまま残すもの
- `lib/queries.ts` — API ルート内で再利用（サーバーサイド関数として有効）
- `middleware.ts` — 変更なし
- `app/api/cron/route.ts`, `app/api/dev/*` — 変更なし
- `db/schema.ts` — 変更なし
- `app/debug/*` — SPA 化対象外（デバッグページなので server のまま）

## 再利用する既存資産

- `lib/queries.ts:getRecentNotes / getRecentLinks / getCollectionStats / getLastSyncTime / getProjectsWithCounts` — `/api/data/*` 内からそのまま呼ぶ
- `app/notes/actions.ts` の `createNote` のロジック — `POST /api/notes` に移植
- `app/tasks/page.tsx` 内の tasks + reminds + projects の join/map 構築ロジック — `/api/tasks` に移植
- `lib/format.ts:relativeTime / getGreeting / truncateText / getNoteHeadline` — client 側でそのまま import 可（pure 関数）

## 実装手順（incremental / 動作確認しながら）

1. `npm install swr`
2. middleware の matcher を更新し、`/api/data/*`, `/api/notes`, `/api/tasks`, `/api/links` を NextAuth から除外する
3. `lib/api-auth.ts`, `lib/api-client.ts` を追加し、`app/providers.tsx` に `SWRConfig` を仕込む
4. `/api/data/stats`, `/api/data/recent`, `/api/data/projects` を追加 → Home ページを client 化して SWR で差し替え → `npm run dev` で動作確認
5. `/api/notes` (GET + POST) を追加 → `QuickCapture` と `NotesView` を SWR 化 → `POST /api/notes` 成功時に notes key だけでなく Home 用の `/api/data/stats` / `/api/data/recent` / `/api/data/projects` も mutate する → `app/notes/page.tsx` を薄いラッパに → 動作確認 → `app/notes/actions.ts` 削除
6. `/api/links` を追加 → `app/links/page.tsx` を SWR 化 → 動作確認
7. `/api/tasks` を追加 → `TasksView` と `app/tasks/page.tsx` を SWR 化 → 動作確認
8. `npm run lint && npm run build` で最終チェック

## 検証手順

### 静的チェック
- [ ] `npm run lint` 通る
- [ ] `npm run build` 通る（server → client 化でのビルドエラーがないこと）
- [ ] `grep -rn "from '@/lib/db'" app/page.tsx app/notes/page.tsx app/tasks/page.tsx app/links/page.tsx` が空（ページから DB 直読みが消えていること）
- [ ] `app/notes/actions.ts` が削除されている
- [ ] middleware が `/api/data/*`, `/api/notes`, `/api/tasks`, `/api/links` を除外している
- [ ] `Authorization` ヘッダが付かない API 呼び出しは 401 になる
- [ ] API レスポンスの日付が client 側で `new Date(...)` できる形式になっている

### 動作確認（`npm run dev`）
- [ ] `/` Home: 統計カード・最近の notes/links・プロジェクト一覧がローディング → 表示
- [ ] `/notes` QuickCapture から投稿 → リストに即反映（SWR `mutate`）
- [ ] `/tasks` フィルタ（open/done/closed）切替が動作
- [ ] `/links` 一覧表示
- [ ] DevTools Network タブで `/api/data/*`, `/api/notes`, `/api/tasks`, `/api/links` が叩かれている
- [ ] ページ遷移しても SWR キャッシュが効いてちらつかない

## リスク・注意点

- **middleware.ts** が `/api/data`, `/api/notes`, `/api/tasks`, `/api/links` を NextAuth セッション保護の対象にしている可能性がある。API key 認証に切り替えた後も、API ルートは middleware を通さずに `Authorization` ヘッダの検証だけで済むように matcher 設定を確認する
- SWR の `fetcher` でエラー時は `throw` して error state に載せる（SWR はそれで error を返す）
- `POST /api/notes` は成功時に作成した note を返し、クライアント側で `mutate` を呼ぶ（再取得）。同時に Home 用の `stats` / `recent` / `projects` も再取得する
- `export const dynamic = 'force-dynamic'` を各 API route に付けて Vercel のキャッシュを無効化
- `'use server'` ディレクティブは新コードに書かない。`lib/queries.ts` は「サーバー側関数」として API route からのみ import する（client からは import しない）
- `createNote` 削除に伴い `revalidatePath` は不要（SWR `mutate` が代替）
- NextAuth の `SessionProvider` と `SWRConfig` の入れ子順は問わないが、両方とも `app/providers.tsx` 内で同居させる
- `API_KEY` はブラウザから見える前提の簡易トークンとして扱い、秘密情報としては扱わない
