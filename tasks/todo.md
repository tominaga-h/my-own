# TODO — Critical / Tests / Dead Code

詳細は [plan.md](plan.md) 参照。Phase 順に逐次実行を推奨。

## Phase 1 — Security Critical

- [ ] **Slice A** — API_KEY leak 解消 / session 認証移行
  - [ ] `lib/api-auth.ts` に `requireSessionUserId(request)` 追加
  - [ ] 全 `/api/*` route handler を session 認証に切替（notes/links/tasks/data/dev-slack）
  - [ ] `app/layout.tsx` から `apiKey` prop 削除
  - [ ] `app/providers.tsx` から `ApiKeyContext` / `useApiKey` 削除、SWR fetcher を bare fetch 化
  - [ ] `lib/api-client.ts` を session 前提に簡素化
  - [ ] 消費側 (Header, QuickCapture, notes/page, lib/sync) 更新
  - [ ] `middleware.ts` matcher から `api/notes|api/tasks|api/links|api/data|api/dev` を削除
  - [ ] 既存テスト fixture を session mock に更新
  - [ ] **Verify**: bundle 内に `API_KEY` が含まれない / unauth 401 / authed 200
- [ ] **Slice B** — timing-safe 比較 + CRON_SECRET early throw
  - [ ] `lib/timing-safe-bearer.ts` 新設
  - [ ] `lib/api-auth.ts` で利用
  - [ ] `app/api/cron/route.ts` で `CRON_SECRET` 起動時 assertion + `verifyBearer` 利用
  - [ ] `lib/__tests__/timing-safe-bearer.test.ts` 追加
- [ ] **Slice C** — debug page CSRF (GET → POST)
  - [ ] `app/debug/slack-sync/page.tsx` を Client Component 化、ボタントリガー
  - [ ] **Verify**: 直接 GET で DB 書き込み無し
- [ ] **Checkpoint 1**: Phase 1 完了確認
  - [ ] DevTools で apiKey が bundle に含まれない
  - [ ] `curl /api/notes` → 401
  - [ ] `npx tsc --noEmit` / `npm run lint` / `npm test` 全 green

## Phase 2 — Correctness Critical

- [ ] **Slice D** — TasksView TZ バグ修正
  - [ ] `lib/date-utils.ts` 新設 (`parseLocalYmd`, `isOverdue`, `fmtMonthDay`, `fmtJaDate`)
  - [ ] `app/tasks/TasksView.tsx` から helper を削除し import に置換
  - [ ] `lib/__tests__/date-utils.test.ts` 追加 (vi.useFakeTimers で JST 境界)
- [ ] **Checkpoint 2**: JST 朝の overdue 誤判定が消えたことをテストで確認

## Phase 3 — Performance Critical

- [ ] **Slice E** — slack-sync bulk INSERT
  - [ ] `lib/slack-sync.ts::syncSlackSelfDmToDatabase` を bulk insert 化
  - [ ] `lib/__tests__/slack-sync.test.ts` 追加 (db/slack を mock、insert 呼び出し回数 assert)
- [ ] **Checkpoint 3**: 1 sync = 最大 3 INSERT に抑えられることをテストで確認

## Phase 4 — Test backfill

- [ ] **Slice F** — signIn callback テスト
  - [ ] `lib/__tests__/auth.test.ts` 追加 (4 ケース)
- [ ] **Slice G** — format.ts 境界値テスト
  - [ ] `lib/__tests__/format.test.ts` 追加
- [ ] **Slice H** — /api/notes POST 異常系テスト
  - [ ] `app/api/notes/__tests__/route.test.ts` 追加 (5 ケース)
- [ ] **Slice I** — cron route テスト
  - [ ] `app/api/cron/__tests__/route.test.ts` 追加 (6 ケース)
- [ ] **Checkpoint 4**: `npm test` で約 120 件全 pass

## Phase 5 — Dead code

- [ ] **Slice J** — `lib/queries.ts` 削除
  - [ ] `git rm lib/queries.ts`
  - [ ] **Verify**: tsc / lint / test / build 全 green
- [ ] **Slice K** — `pages/_document.tsx` 削除
  - [ ] `git rm pages/_document.tsx` + `pages/` 空ディレクトリ削除
  - [ ] **Verify**: ブラウザで `<html lang="ja">` が出力される
- [ ] **Checkpoint 5**: 削除後の最終ビルド・実機確認

## 全体最終 Verification

- [ ] `npx tsc --noEmit` pass
- [ ] `npm run lint` pass
- [ ] `npm test` 全 pass（約 120 件）
- [ ] `npm run build` pass
- [ ] `npm run dev` 実機: サインイン → /tasks /notes /links / QuickCapture / 同期ボタン
- [ ] `grep -r "API_KEY" .next/static` 0 件
- [ ] `curl -i /api/notes` → 401
- [ ] `curl -H "Authorization: Bearer wrong" /api/notes` → 401

## オープンクエスチョン (着手前要確認)

- [ ] Slice A: Bearer フォールバック完全廃止で OK か？（推奨: 廃止）
- [ ] Slice C: debug page UX は最小限ボタンで OK か？
- [ ] dev/slack route を session 必須にする線引き
- [ ] NextAuth session mock パターンの確立 (Slice A 内で実装)
