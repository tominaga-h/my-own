# Tasks UI Refactor プラン (Review I1〜I3)

前回 agent-skills:review で検出した Important 3 件を実装するためのプラン。

## スコープ

| 項目 | 問題 | 目標 |
|------|------|------|
| I1 | `app/tasks/TasksView.tsx` が 2088 行の一枚板 | ファイル分割。main は state + layout のみに絞る |
| I2 | EditModal 保存失敗時に UI フィードバック無し (`TasksView.tsx:1712-1716`) | `saveState: "error"` 追加、フッターにメッセージ表示 |
| I3 | 保存成功後 `setSaveState("saved")` が unmounted component に走る (`TasksView.tsx:1710-1711` + parent `405-408`) | 保存ライフサイクルを EditModal 側に集約し close を後ろ倒し |

スコープ外:
- I4 (テスト) / I5 (フォーカストラップ) → 別プラン
- S1〜S7 群 (連打ガード、optimistic update、タイムゾーン整理等)

## 依存グラフ

```
[Slice A: pure logic 切り出し]
    │   - group-tasks.ts / format.ts / date.ts に切り出し
    │   - 既存 tsc/lint グリーンで main から import に差替え
    │
    ▼
[Slice B: presentational components 抽出]
    │   - Stat / TaskRow / MetaRow / QuickBtn / ModalShell / DetailModal
    │   - EditModal はまだ main ファイル内に残す
    │
    ▼
[Slice C: EditModal 抽出 + I2 + I3]
        - edit-modal.tsx に移植
        - saveState に "error" 追加、catch ブランチで error message 保持
        - close タイミングを EditModal 内に移動（親 onSave は close 呼ばない）
```

**なぜこの順か**: pure logic → presentational → EditModal の順でリスクが上がる。pure は挙動ゼロリスク、presentational は視覚のみ、EditModal はロジック変更込み。各 slice 完了時に動く状態を維持できる。

## 目標ディレクトリ構成

```
app/tasks/
├── TasksView.tsx           # 300行以内、state + layout + hookup
├── page.tsx                # 既存
├── loading.tsx             # 既存
├── components/
│   ├── Stat.tsx
│   ├── TaskRow.tsx
│   ├── ModalShell.tsx
│   ├── DetailModal.tsx
│   ├── MetaRow.tsx
│   ├── QuickBtn.tsx
│   └── EditModal.tsx
└── lib/
    ├── group-tasks.ts      # groupTasks + Bucket type + StatusFilter
    ├── format.ts           # fmtShort / fmtFull / fmtRelative
    ├── date.ts             # isOverdue / toDateInputValue
    └── chevron.ts          # CHEVRON_DATA_URL
```

同一 directory 内で import するだけなので `../../lib/` の既存ユーティリティとは干渉しない。

---

## Slice A: pure logic 切り出し

**範囲**: `TasksView.tsx` の helper 関数と `groupTasks` を別ファイルへ。

**変更対象**:
- 新規 `app/tasks/lib/format.ts` — `fmtShort`, `fmtFull`, `fmtRelative`
- 新規 `app/tasks/lib/date.ts` — `isOverdue`, `toDateInputValue`
- 新規 `app/tasks/lib/group-tasks.ts` — `groupTasks`, `Bucket` type, `StatusFilter` type
- 新規 `app/tasks/lib/chevron.ts` — `CHEVRON_DATA_URL`
- `TasksView.tsx` — 該当関数を削除、import に差替え

**acceptance criteria**:
- `TasksView.tsx` から L28-60 の pure helper 定義が消えている
- `TasksView.tsx` から `groupTasks` 定義が消えている
- 画面挙動は変化なし（filter 切替・グルーピング・日付表示が同じ）
- `StatusFilter` の型名は変えない

**verification**:
1. `rtk npx tsc --noEmit` → tasks 関連でエラー 0
2. `rtk npm run lint` → 0 warnings/errors
3. 手動: `/tasks` 表示、Open/Done/Closed/All 切替、OVERDUE/UPCOMING グループ表示、期限表示
4. diff 差分が純粋に「削除 + import 追加」であることを確認

**Checkpoint**: ここで一度 commit 推奨（`refactor(tasks): extract pure logic`）。以降の slice が失敗しても戻せる。

---

## Slice B: presentational components 抽出

**範囲**: EditModal 以外の表示コンポーネント 6 個を別ファイル化。

**変更対象**:
- 新規 `app/tasks/components/Stat.tsx`
- 新規 `app/tasks/components/TaskRow.tsx`
- 新規 `app/tasks/components/ModalShell.tsx`
- 新規 `app/tasks/components/DetailModal.tsx`
- 新規 `app/tasks/components/MetaRow.tsx`
- 新規 `app/tasks/components/QuickBtn.tsx`
- `TasksView.tsx` — 該当 function 定義を削除、import に差替え

**判断**:
- `MetaRow` と `QuickBtn` は DetailModal からしか呼ばれないが、DetailModal のボリュームを抑えるため独立ファイルにする
- `ModalShell` は DetailModal / EditModal 両方で使うので独立必須
- 各コンポーネントの props interface は既存と同一（挙動不変）
- inline `<style>{...@keyframes tasks-spin...}</style>` の重複は一旦そのまま残す（S1 で別途対処）

**acceptance criteria**:
- `TasksView.tsx` の function 定義残りは `TasksView` 本体と (残した場合) `EditModal` のみ
- ファイル行数 `TasksView.tsx` < 700 行
- 画面挙動は変化なし（行クリックで detail modal、hover背景、完了/star トグル、閉じる、編集遷移）

**verification**:
1. `rtk npx tsc --noEmit` / `rtk npm run lint` クリーン
2. 手動: 行クリック → 詳細モーダル表示
3. 手動: 完了トグル / star トグル → SWR 再取得、UI 更新
4. 手動: 詳細モーダルで閉じる / Esc / 編集ボタン遷移

**Checkpoint**: commit 推奨（`refactor(tasks): split presentational components`）。Slice C で EditModal を触る前に安定版を残す。

---

## Slice C: EditModal 抽出 + I2 + I3 修正

**範囲**: `EditModal` を別ファイルに移し、同時に保存ライフサイクルの 2 件を修正。

### C-1: EditModal 抽出

**変更対象**:
- 新規 `app/tasks/components/EditModal.tsx` — 既存 EditModal をほぼそのまま移植
- `TasksView.tsx` — EditModal 定義削除、import に差替え

**acceptance criteria**:
- `TasksView.tsx` が 300 行以内
- Edit モーダルの既存挙動（title / status / due / project / important の編集、⌘↵ 保存、キャンセル、dirty 判定）は不変

### C-2: I3 修正 — close のタイミング移動

現状 (`TasksView.tsx` 405-408):
```ts
onSave={async (patch) => {
  await patchTask(openTask.taskNumber, patch);
  closeModal();        // ← これで EditModal unmount
}}                     // → 呼び出し側 save() が続けて setSaveState("saved") して警告
```

**変更**:
- parent `onSave` は close を呼ばない。PATCH だけ担当して resolve/reject
- `EditModal.save()` は「成功時 saved state を 400ms 表示してから `props.onSaved()` コール」
- parent に新規 `onSaved` prop（= `closeModal`）を渡す

新しい signature:
```ts
<EditModal
  sel={openTask}
  projects={...}
  onCancel={() => setMode("detail")}
  onSave={async (patch) => patchTask(openTask.taskNumber, patch)}  // close 呼ばない
  onSaved={closeModal}                                             // 保存確定後 close
/>
```

EditModal 内:
```ts
const save = async () => {
  setSaveState("saving");
  const patch = ... // diff 計算（既存ロジックそのまま）
  try {
    await onSave(patch);
    setSaveState("saved");
    window.setTimeout(() => onSaved(), 400);
  } catch (e) {
    setSaveState("error");
    setSaveError(formatSaveError(e));
  }
};
```

### C-3: I2 追加 — error UI

**変更**:
- `saveState` 型を `"idle" | "saving" | "saved" | "error"` に拡張
- `saveError: string | null` state を追加
- `formatSaveError(e)` ヘルパで `ApiError` の status を人間向けメッセージに変換
  - 400: 「入力内容を確認してください」
  - 401 / 403: 「認証エラー」
  - 502: 「my-task-sync に到達できません」
  - その他: 「保存に失敗しました」
- フッター左のキャプションを state に応じて切替（既存 `⌘↵ で保存 · Esc で閉じる` を error 時は赤字エラーメッセージに）
- 再入力や再 click で `saveState === "error"` → リトライ可能（保存ボタンの `disabled` 条件を `saving` のみに）

**acceptance criteria (C 全体)**:
- I3: 保存成功時に React strict mode でも unmount warning が出ない（400ms の `saved` 表示 → close）
- I2: わざと 4xx/5xx を起こす（例: 一時的に Authorization ヘッダを壊す）と、フッターに赤字メッセージが出て「保存」ボタンは再度押せる
- 既存: ⌘↵ / キャンセル / dirty 判定の挙動不変
- `TasksView.tsx` は 300 行以内を維持

**verification**:
1. `rtk npx tsc --noEmit` / `rtk npm run lint` クリーン
2. 手動成功パス:
   - タスク編集で変更 → 保存 → 「保存しました」が一瞬見える → モーダル閉じる → リスト更新
3. 手動エラーパス:
   - devtools の Network で `/api/tasks/*` を Block、保存ボタン押下 → 赤字エラー表示、ボタン再活性
   - Block 解除して再度「保存」で正常完了
4. React strict mode (`<React.StrictMode>` 有効の dev) で unmount 警告がコンソールに出ないこと

**Checkpoint**: commit（`fix(tasks): robust save lifecycle with error UI`）。

---

## 全体の Acceptance

- `TasksView.tsx` < 300 行
- 新規ファイル 11 個、既存ファイル 1 個 (`TasksView.tsx`) 改修のみ
- tsc / lint パス
- タスクページの既存挙動は完全に維持（回帰なし）
- 保存失敗時の UI 表示あり
- 保存成功時 unmount 警告なし

## リスク / 代替案

- **リスク**: inline style の巨大なオブジェクトをファイル分割すると diff が視覚的に読みにくい
  → 対策: Slice B は 1 コンポーネントずつ commit すれば PR レビューが楽。まとめ commit にしたければ commit message で対応コンポーネント列挙
- **リスク**: `onSaved` タイマー 400ms 中にユーザーが × / Esc を押した場合、二重クローズ
  → 対策: `onSaved` はべき等（`setOpenTaskNumber(null)` は 2 回呼んでも同じ）なので害はない。念のためタイマー ref を保持してアンマウント時にクリア
- **代替案**: I2/I3 を I1 と独立させる → 巨大ファイルのまま修正は diff が追いにくい。却下
- **代替案**: Slice B を一気に 1 commit → レビュー負荷高い。却下（1 コンポーネント = 1 commit 推奨）

## 見積もり

- Slice A: 1〜2 commit 相当、30 分
- Slice B: 6 commit 相当、60〜90 分（1 コンポーネント 10〜15 分）
- Slice C: 2〜3 commit 相当、45〜60 分
- 合計: 2〜3 時間

## Checkpoint 一覧

| # | 地点 | 状態 |
|---|------|------|
| CP1 | Slice A 完了 | pure logic が別ファイル、挙動不変 |
| CP2 | Slice B 完了 | EditModal 以外分割済み、挙動不変 |
| CP3 | Slice C-1 完了 | EditModal も分割、挙動不変 |
| CP4 | Slice C-2 完了 | I3 修正（close 遅延）|
| CP5 | Slice C-3 完了 | I2 修正（エラー UI）|

各 CP で手動確認 → commit → 次の slice。何か回帰したら直前 CP に戻せる粒度。
