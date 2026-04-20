# Tasks UI レイアウト & Important トグル — Todo

関連プラン: `tasks/plan-tasks-ui-layout.md`

## Slice 1 — New Task ボタンをページヘッダーへ移動
- [ ] `app/tasks/components/ControlsBar.tsx` から New Task `<button>` と直前の divider を削除
- [ ] `app/tasks/TasksView.tsx:225-233` の Stat チップブロックを既存グラデーションピル風 New Task `<button>` に置き換え
- [ ] `setShowNewTaskModal(true)` に配線
- [ ] 検証: `npm run lint` clean、`/tasks` → New Task クリック → モーダル → タスク作成

**チェックポイント A:** ヘッダー見た目を目視確認してから次へ。

## Slice 2 — リストボックス最上段のインライン Stat 行
- [ ] `TasksView.tsx` の `<section>` 内、`groups.map(...)` の前に `<Stat label="Open" .../>` + 条件付き Important / Overdue を横一列で描画
- [ ] `filtered.length > 0` でゲート
- [ ] サマリー帯として読める padding / divider を選定
- [ ] 検証: タブ切替で数値不変（グローバル）、検索 0 件で Stat 行も消える

## Slice 3 — Important 独立トグルの追加
- [ ] `TasksView.tsx` に `const [importantOnly, setImportantOnly] = useState(false)` を追加
- [ ] `filtered` useMemo に `if (importantOnly && !t.important) return false` を追加
- [ ] status スコープ内の important 数を算出する useMemo `importantInScope` を追加
- [ ] `ControlsBar` に `importantOnly` / `onImportantOnlyChange` / `importantCount` prop を追加
- [ ] `ControlsBar.tsx` で status タブ群の直後に border divider + Important トグルボタンを追加
- [ ] OFF は透明背景、ON は Important カラー系グラデーションで塗る（status タブとの視覚差を確保）
- [ ] ラベルは `Important <count>` 形式、カウントは常時表示
- [ ] 検証: `npm run lint`、Open ↔ Done ↔ All で Important カウント動的更新、ON/OFF で絞り込み動作

**チェックポイント B:** Important の直交動作とカウント動的更新が意図通りか確認。

## Slice 4 — ControlsBar 並び替え: status | Important | Project | Search
- [ ] `ControlsBar.tsx` 内の順序を `[status タブ] | border | [Important] | border | [Project] | [Search]` に再配置
- [ ] 各グループ間に divider を 1 本だけ配置（重複/欠落なし）
- [ ] Search の `flex: 1` は維持
- [ ] 検証: 通常幅 + 狭幅で視覚確認

## Slice 5 — 後片付け
- [ ] `ControlsBar` の `onNewTask` prop をシグネチャ + 呼び出し側から削除
- [ ] 不要 import を削除
- [ ] 検証: `npm run lint` clean、`npm run build` 通過

**チェックポイント C:** 実機でユーザー要望 4 点を通しで確認。
