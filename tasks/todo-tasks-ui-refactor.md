# Tasks UI Refactor TODO (I1〜I3)

参照: `tasks/plan-tasks-ui-refactor.md`

## Slice A: pure logic 切り出し

- [ ] `app/tasks/lib/format.ts` 新規 — `fmtShort`, `fmtFull`, `fmtRelative` を移植
- [ ] `app/tasks/lib/date.ts` 新規 — `isOverdue`, `toDateInputValue` を移植
- [ ] `app/tasks/lib/chevron.ts` 新規 — `CHEVRON_DATA_URL` 定数を移植
- [ ] `app/tasks/lib/group-tasks.ts` 新規 — `groupTasks`, `Bucket`, `StatusFilter` 型を移植
- [ ] `TasksView.tsx` から上記を削除し import に差し替え
- [ ] `rtk npx tsc --noEmit` / `rtk npm run lint` グリーン
- [ ] 手動確認: filter 切替 / グルーピング / 日付表示が不変
- [ ] **CP1 commit**: `refactor(tasks): extract pure logic to lib/`

## Slice B: presentational components 抽出

各コンポーネント 1 commit ずつ。

- [ ] `app/tasks/components/Stat.tsx` 新規 + 差し替え + commit
- [ ] `app/tasks/components/TaskRow.tsx` 新規 + 差し替え + commit（行 hover/toggle 確認）
- [ ] `app/tasks/components/ModalShell.tsx` 新規 + 差し替え + commit（role/aria/scroll lock 確認）
- [ ] `app/tasks/components/MetaRow.tsx` 新規 + 差し替え + commit
- [ ] `app/tasks/components/QuickBtn.tsx` 新規 + 差し替え + commit
- [ ] `app/tasks/components/DetailModal.tsx` 新規 + 差し替え + commit（meta rows / quick actions / 閉じる / 編集遷移確認）
- [ ] tsc / lint グリーン、`TasksView.tsx` < 700 行
- [ ] **CP2**: ここまでで Slice B 完了

## Slice C: EditModal 抽出 + I2/I3

### C-1 抽出

- [ ] `app/tasks/components/EditModal.tsx` 新規 — 既存 EditModal をほぼそのまま移植
- [ ] `TasksView.tsx` から EditModal を削除、import で置換
- [ ] `TasksView.tsx` < 300 行
- [ ] 手動確認: Edit 全機能（title / status / due / project / important / ⌘↵ / キャンセル / dirty）
- [ ] **CP3 commit**: `refactor(tasks): extract EditModal`

### C-2 I3 (close 遅延)

- [ ] EditModal に `onSaved: () => void` prop 追加
- [ ] 親 `TasksView` の `onSave` は PATCH のみ、`onSaved={closeModal}` を渡す
- [ ] `save()` 内で成功後 `setSaveState("saved")` → `setTimeout(onSaved, 400)`
- [ ] `useEffect` で timer ref を unmount 時 clear
- [ ] 手動: React strict mode で保存成功しても unmount 警告が出ない
- [ ] **CP4 commit**: `fix(tasks): delay modal close until save state is committed`

### C-3 I2 (error UI)

- [ ] `saveState` 型に `"error"` 追加
- [ ] `saveError: string | null` state 追加
- [ ] `formatSaveError(e)` ヘルパ（`ApiError` の status を人間向け文言に）
- [ ] `catch` ブランチで `setSaveState("error"); setSaveError(...)`
- [ ] フッターのキャプションを state に応じて切替（error 時赤字）
- [ ] 保存ボタンの `disabled` を `saving` のみに（`error` 状態でもリトライ可能）
- [ ] 手動: Network Block で 401/502 を再現 → 赤字表示、リトライで復帰
- [ ] **CP5 commit**: `feat(tasks): show save error feedback in edit modal`

## 完了チェック

- [ ] `TasksView.tsx` 行数 < 300
- [ ] 新規ファイル: `lib/` 4 + `components/` 7 = 11 個
- [ ] tsc / lint グリーン
- [ ] タスクページの既存挙動が回帰なし
- [ ] Edit 保存失敗時にエラー表示される
- [ ] Edit 保存成功時に unmount 警告が出ない
