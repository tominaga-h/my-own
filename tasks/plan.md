# Critical / Tests / Dead Code 対応プラン

レビュー結果（agent-skills:review 第3回）から抽出した Critical 6 件、テスト不足 5 件、dead code 2 件を vertical slice で実装するプラン。

## スコープ

| 種別 | 件数 | 詳細 |
|------|------|------|
| Critical | 6 | API_KEY 漏洩 / 非 constant-time 比較 / CRON_SECRET undefined / debug GET 書き込み / slack-sync N+1 / TZ バグ |
| Test gaps | 5 | slack-sync / TZ helpers / cron / signIn / format |
| Dead code | 2 | lib/queries.ts / pages/_document.tsx |

スコープ外: Important / Suggestion 群（別プラン化）。

## 依存グラフ

```
[Slice A: API_KEY 廃止] ──┬──► [Slice B: timing-safe + CRON early throw]
                          │
                          ├──► [Slice F: signIn テスト]
                          │
                          └──► [Slice H: /api/notes POST テスト]

[Slice C: debug page CSRF]   ── 独立
[Slice D: TZ バグ]            ── 独立
[Slice E: slack-sync bulk]    ── 独立
[Slice G: format テスト]       ── 独立
[Slice I: cron テスト]         ── B 完了後
[Slice J: queries.ts 削除]     ── 独立
[Slice K: _document.tsx 削除]  ── 独立
```

**A → B は逐次必須**（lib/api-auth.ts を両方が書き換えるためコンフリクト回避）。
それ以外は理論上並列可。実運用上は Phase 順で逐次実行を推奨。

## Phase 構成

### Phase 1: Security Critical（最優先）

API_KEY 漏洩が穴開いている間は他の修正の意味が薄い。先に塞ぐ。

| Slice | タイトル | 影響範囲 |
|-------|---------|---------|
| A | API_KEY leak 解消 / session 認証移行 | lib/api-auth, providers, layout, Header, QuickCapture, notes/page, middleware, 全 API route |
| B | timing-safe 比較 + CRON_SECRET early throw | lib/api-auth, app/api/cron/route |
| C | debug page CSRF（GET → POST トリガー化） | app/debug/slack-sync/page |

**Checkpoint 1**: Phase 1 完了後、ブラウザバンドルに `apiKey` が含まれないこと、unauth 状態で `/api/*` が 401 を返すことを実機確認。

### Phase 2: Correctness Critical

| Slice | タイトル | 影響範囲 |
|-------|---------|---------|
| D | TasksView TZ バグ修正 | app/tasks/TasksView.tsx → 抽出 lib/date-utils.ts |

**Checkpoint 2**: JST 朝（00:00–09:00）に "今日 due" タスクが overdue 判定されないことをテストで確認。

### Phase 3: Performance Critical

| Slice | タイトル | 影響範囲 |
|-------|---------|---------|
| E | slack-sync bulk INSERT 化 | lib/slack-sync.ts |

**Checkpoint 3**: 100 メッセージ backfill が単一 INSERT 2 本（notes/links）+ 単一 syncStates upsert の計 3 RTT 以内になることをテストで確認。

### Phase 4: Test backfill

| Slice | タイトル | 影響範囲 |
|-------|---------|---------|
| F | signIn callback テスト | lib/__tests__/auth.test.ts (新規) |
| G | format.ts 境界値テスト | lib/__tests__/format.test.ts (新規) |
| H | /api/notes POST 異常系テスト | app/api/notes/__tests__/route.test.ts (新規) |
| I | cron route テスト | app/api/cron/__tests__/route.test.ts (新規) |

**Checkpoint 4**: `npm test` が 87 + 新規 30+ で全 pass。

### Phase 5: Dead code

| Slice | タイトル | 影響範囲 |
|-------|---------|---------|
| J | lib/queries.ts 削除 | lib/queries.ts |
| K | pages/_document.tsx 削除 + pages/ ディレクトリ削除 | pages/_document.tsx |

**Checkpoint 5**: 削除後 `tsc --noEmit` / `npm run lint` / `npm test` / `npm run build` 全 green。

---

## Slice 詳細

### Slice A — API_KEY leak 解消 / session 認証移行

**問題**: `app/providers.tsx:24` で `apiKey` が React Context に渡され、`app/layout.tsx:18` 経由で全ページの client bundle に同梱。HTML を取得できる誰でも `Authorization: Bearer <API_KEY>` で `/api/notes`, `/api/tasks`, etc. を叩ける。

**変更**:
1. `lib/api-auth.ts` に `requireSessionUserId(request)` を追加（NextAuth `getServerSession` で session.user.id を取得）。`requireApiUserId` は **server-to-server 用 (cron, my-task-sync 等) として残す** が、ブラウザからは呼ばれない設計に。
2. ブラウザから叩く全 route handler を `requireSessionUserId` に切替:
   - `app/api/notes/route.ts` GET/POST
   - `app/api/links/route.ts` GET
   - `app/api/tasks/route.ts` GET/POST
   - `app/api/tasks/[taskNumber]/route.ts` GET/PATCH
   - `app/api/data/{stats,recent,projects}/route.ts` GET
   - `app/api/dev/slack/{sync,self-dm}/route.ts` POST/GET（debug 用なので session 必須に格上げ）
3. `app/layout.tsx`: `<Providers apiKey=...>` から `apiKey` prop を削除
4. `app/providers.tsx`: `ApiKeyContext` / `useApiKey` を削除。SWR fetcher を bare `fetch()`（cookie が自動送信される）に簡素化
5. `lib/api-client.ts`: `createApiFetcher(apiKey)` → `createSessionFetcher()`。`apiFetchJson(apiKey, url, init)` → `apiFetchJson(url, init)` (Authorization header を付けない、cookie が credentials 自動送信)
6. 消費側更新:
   - `app/components/Header.tsx`: `useApiKey()` 削除、`runAllSync()` の引数も削除
   - `app/components/QuickCapture.tsx`: 同上
   - `app/notes/page.tsx`: 同上
   - `lib/sync.ts`: `runAllSync(apiKey: string)` → `runAllSync()`
7. `middleware.ts`: matcher から `api/notes|api/tasks|api/links|api/data|api/dev` を削除し NextAuth 保護下に。`api/cron` と `api/auth` は除外維持

**Acceptance**:
- ブラウザで View Source / DevTools Network → bundle に `API_KEY` 値が含まれない
- 未ログイン状態で `curl http://localhost:3000/api/notes` → 401
- ログイン済 cookie 有り `curl --cookie ... http://localhost:3000/api/notes` → 200
- `curl -H "Authorization: Bearer <wrong-key>" http://localhost:3000/api/notes` → 401（Bearer フォールバックは廃止）
- `npm run dev` で QuickCapture 投稿が動作する（cookie 認証）

**Verification**:
1. `npx tsc --noEmit` 通過
2. `npm run lint` 通過
3. `npm test` 全 pass（既存テストは Bearer 認証前提なので **同じ Slice 内で test fixture 更新**: route handler テストは cookie mock または `requireSessionUserId` の vi.mock）
4. `npm run dev` で /tasks /notes /links を実機ブラウザ動作確認
5. `grep -r "API_KEY" .next/static` が 0 件

**Risk**: 全 API route を一気に書き換えるため大きい slice。逆に部分的に切り替えると認証手段の二重管理になる。**一括移行が安全**。

---

### Slice B — timing-safe 比較 + CRON_SECRET early throw

**問題**:
1. `lib/api-auth.ts:19` の `authHeader !== \`Bearer ${apiKey}\`` は非 constant-time
2. `app/api/cron/route.ts:6` 同上 + `CRON_SECRET` 未設定時に `"Bearer undefined"` で通過する footgun

**変更**:
1. `lib/api-auth.ts`: `requireApiUserId` 内で `crypto.timingSafeEqual` 比較。長さ事前チェックで早期 false を返してから比較
2. 共通ヘルパ `lib/timing-safe-bearer.ts` を切り出し: `verifyBearer(authHeader: string | null, expected: string): boolean`
3. `app/api/cron/route.ts`: 起動時に `CRON_SECRET` 未設定なら `throw new Error("CRON_SECRET is required")`、`verifyBearer` で比較。`runtime`/`dynamic` export も追加（Important 群と一緒に）

**Acceptance**:
- `lib/timing-safe-bearer.ts` 新設、`requireApiUserId` と cron が共通利用
- 環境変数未設定で `/api/cron` 起動時に明示的エラー
- 任意の `Authorization: Bearer <wrong>` で 401（タイミング差なし）

**Verification**:
1. ユニットテスト `lib/__tests__/timing-safe-bearer.test.ts`:
   - 正しい token → true
   - 間違った token → false
   - 異なる長さ → false（早期）
   - null → false
2. cron route テスト（Slice I で同時整備）が pass

**Risk**: 低。スコープ限定的。

---

### Slice C — debug page CSRF（GET → POST トリガー化）

**問題**: `app/debug/slack-sync/page.tsx` が GET レンダリングで `syncSlackSelfDmToDatabase()` を呼ぶ → CSRF (`<img src=...>` / link prefetch) で書き込み発火。

**変更**:
1. `app/debug/slack-sync/page.tsx` を Server Component → Client Component に変更
2. ボタン click → `fetch("/api/dev/slack/sync", { method: "POST" })` 経由で実行
3. `app/debug/slack/page.tsx` (read-only fetch) は GET のままで OK

**Acceptance**:
- `/debug/slack-sync` を直接 GET しても DB 書き込み無し（ページ表示だけ）
- ボタン押下で POST 経由で同期実行され結果表示

**Verification**:
1. `npm run dev` で `/debug/slack-sync` を GET → DB row 数が変わらないことを確認
2. ボタン押下で同期成功を確認

**Risk**: 低。1 ファイル変更。

---

### Slice D — TasksView TZ バグ修正

**問題**: `app/tasks/TasksView.tsx:24-27` の `isOverdue`, `fmtShort`, `fmtFull` で `new Date("YYYY-MM-DD")` (UTC parse) と `new Date().toDateString()` (local parse) が混在 → JST 00:00–09:00 の間「今日 due」が overdue 誤判定。

**変更**:
1. `lib/date-utils.ts` を新設し pure helper を集約:
   - `parseLocalYmd(s: string): Date` — `"2026-04-19"` を local midnight に
   - `isOverdue(due: string | null, status: string, now?: Date): boolean`
   - `fmtMonthDay(date: string | Date | null): string` (旧 fmtShort)
   - `fmtJaDate(date: string | Date | null): string` (旧 fmtFull)
2. `app/tasks/TasksView.tsx` から helper を削除し `lib/date-utils.ts` を import

**Acceptance**:
- `lib/__tests__/date-utils.test.ts` で JST 朝の境界をテスト:
  - 2026-04-19 08:00 JST に due="2026-04-19" の open task → `isOverdue` false
  - 2026-04-18 23:59 JST に due="2026-04-19" の open task → `isOverdue` false
  - 2026-04-20 00:01 JST に due="2026-04-19" の open task → `isOverdue` true
  - status="done" は常に false
  - due=null は常に false

**Verification**:
1. `vi.useFakeTimers` で時刻固定したテスト全 pass
2. `npx tsc --noEmit` / `npm run lint` 通過

**Risk**: 低。pure function 抽出 + テスト。

---

### Slice E — slack-sync bulk INSERT

**問題**: `lib/slack-sync.ts:84-133` で 1 メッセージ = 1 INSERT round-trip。`neon-http` ドライバでは毎回 HTTPS RTT。100 件 backfill で Vercel function timeout リスク。

**変更**:
1. `syncSlackSelfDmToDatabase` 内のループを「分類だけ」に変更:
   ```ts
   const noteValues: NoteInsert[] = [];
   const linkValues: LinkInsert[] = [];
   for (const message of messages) { /* push */ }
   ```
2. ループ後に bulk insert:
   ```ts
   const insertedNotes = noteValues.length
     ? await db.insert(notes).values(noteValues).onConflictDoNothing(...).returning({ id: notes.id })
     : [];
   const insertedLinks = linkValues.length
     ? await db.insert(links).values(linkValues).onConflictDoNothing(...).returning({ id: links.id })
     : [];
   ```
3. `lastMessageTs` 計算は分類ループ内で完結
4. `syncStates` upsert は変更なし

**Acceptance**:
- 1 回の sync 呼び出しで Neon への INSERT は最大 3 回（notes / links / syncStates）
- `notesInserted` / `linksInserted` の値は変更前と一致
- 既存の `onConflictDoNothing` による dedup 挙動を維持

**Verification**:
1. `lib/__tests__/slack-sync.test.ts` 新設（Slice 内同梱）:
   - `getMostLikelySelfDmSince` を vi.mock
   - `db` も vi.mock し、`db.insert(...).values(...)` の呼び出し回数を assert
   - URL あり/なしのメッセージ混在で notes/links に正しく振り分けられること
   - 空メッセージは insert 呼ばれないこと
   - `lastMessageTs` 計算が正しいこと
2. `npm test` で新テスト全 pass

**Risk**: 中。挙動変更を伴うため tests 必須。

---

### Slice F — signIn callback テスト

**問題**: `lib/auth.ts::signIn` callback は UI 唯一のアクセスゲートだが未テスト。

**変更**:
1. `lib/__tests__/auth.test.ts` 新設:
   - `ALLOWED_GITHUB_LOGIN` 未設定 → false
   - `ALLOWED_GITHUB_LOGIN="alice"` + `profile.login="alice"` → true
   - 同 + `profile.login="bob"` → false
   - 同 + `profile` なし → false

**Acceptance**: 上記 4 ケース pass。

**Verification**: `npm test` 全 pass。

**Risk**: なし。

---

### Slice G — format.ts 境界値テスト

**問題**: `lib/format.ts` の `relativeTime` / `getGreeting` / `truncateText` / `getNoteHeadline` が未テスト。

**変更**:
1. `lib/__tests__/format.test.ts` 新設:
   - `relativeTime`: 0s / 59s / 60s / 3599s / 3600s / 86399s / 86400s
   - `getGreeting`: 0 / 11 / 12 / 16 / 17 / 23
   - `truncateText`: 短文 (no-op) / max 境界 / 超過
   - `getNoteHeadline`: 単一行 / 複数行（先頭が空）/ 全行空 → "Untitled note"

**Acceptance**: 全境界値 pass。

**Verification**: `npm test` 全 pass。

**Risk**: なし。

---

### Slice H — /api/notes POST 異常系テスト

**問題**: notes POST の異常系 (空 body / 欠落 body / malformed JSON) が未テスト。

**変更**:
1. `app/api/notes/__tests__/route.test.ts` 新設（colocation pattern）:
   - 認証未設定 → 401
   - body なし → 400 "本文が空です"
   - `{ body: "  " }` → 400
   - malformed JSON → 400 (現状 throw される → Slice A で `mapErrorResponse` 統一する場合はそちらに合わせる)
   - `{ body: "test" }` → 201 + DB row inserted
2. DB は vi.mock (`createNote` を mock) で OK

**Acceptance**: 上記 5 ケース pass。

**Verification**: `npm test` 全 pass。

**Risk**: 低。Slice A が完了してから書く（auth 仕様が変わるため）。

---

### Slice I — cron route テスト

**問題**: `/api/cron` の auth + 207 multi-status path が未テスト。`CRON_SECRET=undefined` footgun と合わせて急務。

**変更**:
1. `app/api/cron/__tests__/route.test.ts` 新設:
   - `CRON_SECRET` 未設定 → 起動時 throw（Slice B 仕様）
   - 正しい Bearer → 200 + `ok: true`
   - 間違った Bearer → 401
   - missing Authorization → 401
   - `syncSlackSelfDmToDatabase` が throw → 207 + `errors.slack` 含む
   - 全成功 → 200

**Acceptance**: 上記 6 ケース pass。

**Verification**: `npm test` 全 pass。

**Risk**: 低。Slice B 完了後に書く。

---

### Slice J — lib/queries.ts 削除

**問題**: `lib/queries.ts` 全体が dead code（`api-data.ts` と機能重複、route から未参照）。

**前提確認**: `grep -rn "from.*lib/queries" app/ lib/` で参照ゼロを再確認済み。

**変更**:
1. `git rm lib/queries.ts`

**Acceptance**:
- ファイル削除後 `tsc --noEmit` / `npm run lint` / `npm test` / `npm run build` 全 green

**Risk**: なし（事前確認済み）。

---

### Slice K — pages/_document.tsx 削除

**問題**: App Router 下で `pages/_document.tsx` は vestigial。`app/layout.tsx` が同等を担当。

**前提確認**: `pages/` ディレクトリには `_document.tsx` のみ存在 → ディレクトリごと削除可能。

**変更**:
1. `git rm pages/_document.tsx`
2. `pages/` 空ディレクトリも削除

**Acceptance**:
- 削除後 `tsc --noEmit` / `npm run lint` / `npm test` / `npm run build` 全 green
- ブラウザで `<html lang="ja">` が出力されること（`app/layout.tsx` から）

**Risk**: 低。layout が html/body を出力するので動作変わらない。

---

## 全体 Verification

各 Phase の checkpoint に加えて、最終的に全 Slice 完了後:

1. `npx tsc --noEmit` 通過
2. `npm run lint` 通過
3. `npm test` 全 pass（87 + 新規約 30 = 約 120 件）
4. `npm run build` 通過
5. `npm run dev` で実機ブラウザ動作確認:
   - サインイン → /tasks /notes /links 表示
   - QuickCapture でメモ投稿
   - Header 同期ボタンで Slack + Tasks 同期
   - DevTools で `apiKey` 文字列が bundle に含まれない
6. `curl -i http://localhost:3000/api/notes` → 401（Cookie 無し）
7. `curl -H "Authorization: Bearer wrong" http://localhost:3000/api/notes` → 401

## オープンクエスチョン

1. **Slice A スコープの確認**: Bearer フォールバックを完全廃止する案で進めるか、my-task-sync 等の server-to-server 用に残すか？
   - **推奨**: 完全廃止（現状 server-to-server 呼び出しは無し。将来必要になったら別ヘルパで再導入）
2. **Slice C のボタン UX**: debug page なので最低限の "Run sync" ボタンで OK か？
3. **dev/slack ルートの保護**: Slice A で session 必須にしたが、本番 cron からは呼ばれない（cron は `/api/cron` 経由）。debug 専用と割り切って良いか？
4. **テスト fixture**: NextAuth session の mock パターンが未確立。Slice A で `vi.mock("next-auth")` パターンを確立する。

これらを確認してから着手したい。
