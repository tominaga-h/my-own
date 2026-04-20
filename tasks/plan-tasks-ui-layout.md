# Tasks UI レイアウト & Important トグル — プラン

## ゴール

Tasks ページのヘッダーとコントロールバーを以下のように再構成する:

1. ヘッダーにある Stat カウント（Open / Important / Overdue）を、body のリストボックス内（Today / No due の一番上）へ移動。
2. "New Task" ボタンを `ControlsBar` から取り外し、ページヘッダー右端（旧 Stat の位置）へ移動。
3. **Important を独立トグル**として追加。status タブ（Open/Done/Closed/All）とは直交し、現在選択中の status スコープに `important === true` を追加で適用する。
4. `ControlsBar` の並びを `[status タブ群] | border | [Important] | border | [Project プルダウン] | [Search]` にする。

## スコープ

クライアント側のみ。変更ファイル:

- `app/tasks/TasksView.tsx`
- `app/tasks/components/ControlsBar.tsx`

`app/tasks/lib/group-tasks.ts` は **触らない**（Important は単なる絞り込みなのでバケット分類ロジックは status タブ側のまま使う）。

DB / API / スキーマの変更は無し。

## 前提

1. **Important は独立トグル**。`importantOnly: boolean` という state を新設し、status タブの値とは別管理する。
2. **フィルタ合成**は AND: `(status 条件) AND (importantOnly ? important===true : true)`。
3. **Important ボタンのカウント** = 現在の status スコープ内で `important === true` となるタスクの数。動的。
   - 例: status=Open → `tasks.filter(t => t.status==="open" && t.important).length`
   - 例: status=All → `tasks.filter(t => t.important).length`
4. **インライン Stat** はリスト `<section>` 内の最上段、最初のグループヘッダー上に横一列で描画。値は**グローバル**カウント（フィルタ非連動）。
5. **`filtered.length === 0` のときは Stat 行を出さない。**
6. **コントロールバー並び順**: `[Open | Done | Closed | All] | border | [Important] | border | [Project] | [Search]`。New Task はバーから外し、ページヘッダー右端へ。
7. **status タブは Open | Done | Closed | All のまま**（Important は兄弟タブではなく別枠）。

## 依存グラフ

```
TasksView.importantOnly state ── 新設（boolean）
        │
        ├──► TasksView.filtered useMemo ── importantOnly 時に t.important 絞り込み追加
        │
        └──► TasksView に渡す important count ── 現在の status × important の動的集計
                    │
                    └──► ControlsBar ── Important トグルボタンの ON/OFF + カウント表示

ControlsBar レイアウト ── status タブ | border | Important | border | Project | Search
                          New Task 削除

ページヘッダー ── Stat チップ削除、New Task ボタン追加
        │
        └──► リスト <section> ── 最上段に Stat 行追加
```

Slice 1 / 2 は他と独立。Slice 3 が Important トグル追加の本体。Slice 4 で並び替え。Slice 5 で後片付け。

## Vertical Slice

各 Slice は独立してコンパイル・lint 通過・ブラウザ確認できる完結した変更。

### Slice 1 — New Task ボタンをページヘッダーへ移動

最小変更。ヘッダーの再構成が成立することを先に確認してから他に進む。

- `ControlsBar.tsx` から New Task `<button>` と直前の divider を削除。`onNewTask` prop はシグネチャ上は一旦残す（Slice 5 で削除）。
- `TasksView.tsx` のページヘッダー内、Stat チップブロック（`TasksView.tsx:225-233`）を New Task `<button>` に置き換え、右端に配置。既存の ControlsBar 側グラデーションボタンのスタイルをそのまま流用。

**受け入れ条件**

- ヘッダーは「Workspace / Tasks」が左、右端に New Task ピル。
- New Task クリックで `NewTaskModal` が開く。
- ControlsBar 側には New Task ボタンが存在しない。
- Stat チップはどこにも出ていない（Slice 2 で復活）。

**検証**

- `npm run lint`
- `npm run dev` → `/tasks` → ヘッダー見た目確認、New Task → モーダル → タスク作成でリストに反映。

### Slice 2 — リストボックス最上段に Stat 行を追加

- `TasksView.tsx` のリスト `<section>` 内、`groups.map(...)` の前に Stat 行を描画。
- `<Stat label="Open" value={counts.open} tone="#4f46e5" />` は常時。`Important` は `counts.important > 0`、`Overdue` は `counts.overdue > 0` のとき条件付きで表示。
- `padding: "14px 24px"` + 下に薄い divider で、サマリー帯として読めるレイアウトに。
- `filtered.length > 0` のときだけ描画。

**受け入れ条件**

- リストボックス上部に Open / (Important) / (Overdue) の横一列カウント。
- 値はグローバル（全タスク由来）でフィルタ非連動。
- 結果 0 件のとき Stat 行はプレースホルダーと一緒に消える。

**検証**

- 手動: タブ切り替えで数字が変わらない。
- 手動: マッチしない検索語 → Stat 行が消える。
- 手動: 最初のグループヘッダーとの間隔が破綻していない。

### Slice 3 — Important 独立トグル追加

- `TasksView.tsx`:
  - `const [importantOnly, setImportantOnly] = useState(false)` を追加。
  - `filtered` useMemo に `if (importantOnly && !t.important) return false` を追加。
  - Important ボタン用の動的カウントを算出:
    ```ts
    const importantInScope = useMemo(() => {
      return tasks.filter(t => {
        if (filter !== "all" && t.status !== filter) return false;
        return t.important;
      }).length;
    }, [tasks, filter]);
    ```
    （project / search は除外してもよい。「status スコープ内の important 数」というシンプルな定義にする。必要なら後で調整）
  - `ControlsBar` に `importantOnly` / `onImportantOnlyChange` / `importantCount` prop を新規で渡す。
- `ControlsBar.tsx`:
  - status タブ群の後、border divider を挟んで Important トグルボタンを追加。
  - ON のとき `background: linear-gradient(90deg,#f59e0b,#fbbf24)` 相当の強調（または Important カラー系）。OFF のとき透明背景。
  - ラベル: `Important <count>`。カウント表示は status タブ方式と揃える。
  - クリックで `onImportantOnlyChange(!importantOnly)`。

**受け入れ条件**

- status タブは Open | Done | Closed | All のまま変わらない。
- タブ群の右に divider、その右に Important トグル、さらに右に divider。
- Important OFF → 通常のフィルタ。ON → 現在 status に `important===true` を AND で適用。
- Important のカウントは status を切り替えると動的に更新される（Open 時は open&important 数、All 時は全 important 数）。
- Important OFF のときもバッジ数字は見える（status スコープ内の important 総数）。

**検証**

- `npm run lint`
- 手動: Open 選択 → Important トグル ON → open かつ important のみ表示。
- 手動: Done に切り替え → Important カウントが done&important 数に変わる。ON なら done&important リスト。
- 手動: タスクを important にマーク/解除 → Important カウントが増減する。

### Slice 4 — ControlsBar 並び替え: status | Important | Project | Search

- `ControlsBar.tsx` の順序を最終形 `[status タブ] | border | [Important] | border | [Project] | [Search]` に揃える。
- 既存の `[status タブ] | border | Search | border | Project | border | NewTask` 構造を解体し、divider も各グループ間に 1 本だけ残す形で再配置。
- Search の `flex: 1` は維持。

**受け入れ条件**

- コントロールバーは左から status タブ群、border、Important トグル、border、Project プルダウン、Search ボックスの順。
- divider は重複も欠落もない。
- 狭幅時の `flexWrap` 折り返しが既存通り動く。

**検証**

- 手動: 通常幅と狭幅で視覚確認。

### Slice 5 — 後片付け

- `ControlsBar` の `onNewTask` prop をシグネチャ + `TasksView.tsx` 呼び出し側から削除。
- 不要 import を削除。
- 不要 divider / 空白の最終確認。

**受け入れ条件**

- `ControlsBar` の型定義に `onNewTask` が無い。
- `npm run lint` clean。
- `npm run build` 通過。

**検証**

- `npm run lint`
- `npm run build`

## チェックポイント

- **Slice 1 完了後** — ヘッダーのレイアウトが視覚的に成立し、New Task モーダルが新しい位置から開くことを確認。
- **Slice 3 完了後** — Important トグルの直交動作（status × important）とカウントの動的更新を実機確認。
- **Slice 5 完了後** — ユーザー要望 4 点すべてを実機で通しで確認。

## リスク / 地味に注意したい点

- **Important カウントの定義**: 上のプランでは「status スコープ内の important 数」とし、project / search は含めていない。これはタブバーがフィルタ選択前のナビゲーション要素である、という解釈。もし「現在の全フィルタ通過後の important 数」としたい場合は `filtered.filter(t=>t.important).length` に変える（その場合 importantOnly 自身の評価をスキップする必要あり、要配慮）。
- **トグル ON/OFF の視覚**: status タブは単一選択のラジオ的挙動、Important はチェックボックス的挙動。同じ見た目にすると混乱するので、ON/OFF の差を背景色で明確に（OFF は透明、ON は Important カラーで塗る）。
- **ヘッダーボタンの縦位置**: ヘッダーは `alignItems: "flex-end"`。違和感があればボタン側ラッパーだけ `alignItems: "center"` に。
- **インライン Stat のサイズ感**: `Stat` はヘッダー用設計で body 内ではやや大きく見えるかも。MVP としては許容、気になれば微調整。

## スコープ外

- インライン Stat をフィルタ連動にする。
- `Stat` コンポーネントのビジュアル変更。
- `flexWrap` デフォルト挙動以上のモバイル最適化。
- status タブの並び変更。
- Important に Overdue / Today 系のサブバケット分けを新設する。
