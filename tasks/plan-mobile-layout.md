# Plan: モバイル表示の破綻を直す

## 背景

iPhone (≈375px) で `my-own-theta.vercel.app` を開くと以下が壊れる:

1. **Header が折り返す** — ロゴ `my-own` が `my / own` と縦に割れ、`Tasks` も折り返し、`Sign out` が画面外に切れる。原因は `app/components/Header.tsx:46` が `max-w-[1600px] px-5` 固定で `flex justify-between` の子要素（logo + nav3個 + 同期 + Sign out）を常に横並びにしており、モバイル用分岐が無いこと。
2. **Links ページが「便せん」状態** — OGP画像 (`slack_attachments[].image_url`) を持たないリンクが並ぶと、`aspect-[40/21]` の画像エリアが `radial-gradient(rgba(248,250,252)...)` でほぼ白、カード枠が `border-slate-200` で極薄。モバイル1カラムでそれが縦に積まれ、薄い横線だけが並んで見える。

このプランはこの2つを直す範囲に限定する（Notes/Tasks ページのモバイル最適化は別 issue）。

## 非目標

- Header のデザイン刷新（色・フォント・ロゴ差し替え等）
- Links カードのデザイン刷新（レイアウト思想の変更）
- 新機能追加（モバイル用ドロワー以外）
- PWA 化・viewport メタタグ以外のネイティブ対応

## 前提と制約

- Next.js 15 App Router + Tailwind v4。`sm: 640px / md: 768px / lg: 1024px / xl: 1280px` は Tailwind 既定。
- iPhone SE (375px 幅) を最小サポート。
- Header は sticky で全ページに表示される共通レイアウト。変更影響は Notes/Tasks/Links 全て。
- Links カードの変更は Links ページに閉じる（共通コンポーネントではない）。
- `next-auth` セッションの有無で `同期`/`Sign out` ボタンの出し分けは現行を踏襲。

## アーキテクチャ判断

### Header: ハンバーガーメニュー採用

**採用: モバイル (`sm:` 未満) でハンバーガーメニューを出し、Nav (Tasks/Notes/Links) と `Sign out` はドロワー内に格納。`同期` ボタンはアイコンのみでヘッダーに残す。**

- モバイル時の Header 構成: `[ロゴ] ... [同期アイコン] [☰ ハンバーガー]`
- ドロワー: 上からスライドインするシンプルなパネル。中身は Nav 3項目 + `Sign out`。
- `sm:` 以上はハンバーガー非表示で従来どおりの横並び。
- a11y: `aria-expanded`, `aria-controls`, `Esc` で閉じる, 背景クリックで閉じる, フォーカストラップはやらない（項目4つなので簡易実装で十分）。
- 状態管理: `useState<boolean>` 1つ。外部ライブラリは追加しない。
- ルート遷移時は自動的に閉じる（`usePathname` を watch）。

### Links: 画像無しカードのレイアウト

**採用: `image_url` の有無で分岐し、無いときは画像エリアを描画しない。**

- 現状: 画像無し時は `aspect-[40/21]` の空 gradient ブロックを描画 → 白に埋もれる。
- 変更: 画像無し時は画像エリアを省略し、content block だけの1枚カードに。サービス名バッジは content 側ヘッダ行へ。
- 補助: 画像エリアの placeholder を濃くする案もあるが、画像無しが大半の現実を踏まえて「出さない」を主策に。

## 影響ファイル

| ファイル | 変更の要旨 |
| --- | --- |
| `app/components/Header.tsx` | モバイル時 Nav/Sign out をハンバーガードロワーに格納、同期ボタンをアイコン化、padding 圧縮、`flex-nowrap` 明示、ドロワー state とルート遷移での自動クローズ |
| `app/links/page.tsx` | `image_url` の有無で画像エリア分岐、`min-h-[232px]` を `md:` のみに、画像無しカードに左アクセント、モバイルの grid gap 圧縮 |
| `app/links/LinksSkeleton.tsx` | 変更なし見込み（`bg-slate-200` のまま視認可）|

※ Notes/Tasks 本文の余白 (`px-3 sm:px-4`) は現行で許容、触らない。

## 依存グラフ

```
Slice A: Header 修正  ──┐
                       ├─→ CP3: モバイル/デスクトップ双方の最終確認
Slice B: Links カード ──┘
```

両スライスは独立。並列で進めて良い。

## 実装スライス（縦割り）

### Slice A — Header にハンバーガーメニューを導入

**狙い**: 375px で Header が1行に収まり、主要導線 (Tasks/Notes/Links/同期/Sign out) 全てにアクセスできる。`sm:` 以上では従来のレイアウト維持。

**変更点**:
- `app/components/Header.tsx:46` コンテナ padding を `px-3 sm:px-5`
- `app/components/Header.tsx:50` ロゴ `<span>my-own</span>` に `hidden sm:inline`
- 既存の Nav (`<nav>`) と `Sign out` ボタンに `hidden sm:flex` / `hidden sm:inline-flex` 付与
- 同期ボタンのテキストラベル (`同期中…` / `同期`) を `<span className="hidden sm:inline">` で包みモバイル時アイコンのみに
- ハンバーガートグルボタン追加: `sm:hidden` でモバイル時のみ表示、`aria-expanded`, `aria-controls="mobile-nav"`, `aria-label="メニュー"`
- ドロワー追加: `id="mobile-nav"`, `sm:hidden`, `<dialog>` or `<div role="dialog" aria-modal="false">`。ヘッダー直下に `absolute`/`fixed` でパネル展開。中身は既存 Nav 3項目 + `Sign out` ボタンを再利用（縦並び、タップ領域 `py-3 px-4` で広めに）
- 背景オーバーレイ: 半透明背景クリックで閉じる
- 開閉 state: `const [menuOpen, setMenuOpen] = useState(false)`
- `useEffect(() => setMenuOpen(false), [pathname])` でルート変更時に自動クローズ
- `Esc` キーで閉じる (`useEffect` で `keydown` リスナ)
- 右側コンテナに `flex-nowrap` 明示、`gap-3` → `gap-1 sm:gap-3`

**受け入れ基準 (AC)**:
- [ ] 375px で Header が1行に収まり、横スクロール無し
- [ ] モバイルでハンバーガーをタップするとドロワーが開き、Tasks/Notes/Links/Sign out が全てタップできる
- [ ] ドロワー内のリンクをタップすると画面遷移し、ドロワーが自動で閉じる
- [ ] `Esc` キー・背景クリックでドロワーが閉じる
- [ ] `aria-expanded` がトグル状態を反映する
- [ ] 同期ボタンはモバイルでアイコンのみ、`aria-label` 残置
- [ ] デスクトップ (≥640px) でハンバーガー非表示・従来レイアウト維持

**検証**:
1. `npm run dev` → Chrome DevTools Mobile (iPhone SE 375×667) で /tasks /notes /links
2. ハンバーガー開閉、各リンクタップ → 遷移、Esc、オーバーレイクリック
3. 640px に広げるとハンバーガーが消え従来 Nav が出ることを確認
4. 1280px でデスクトップ回帰無し

### Slice B — Links カードを画像有無で出し分け

**狙い**: OGP画像無しリンクでも「何があるか」が一目で分かるカードに。モバイルで便せん状態を解消。

**変更点**:
- `app/links/page.tsx:87` `imageUrl` null 時は画像エリア `<a>/<div>` を描画しない
- content ヘッダ行（`#{row.id}` バッジ行）にサービス名バッジを併置
- `app/links/page.tsx:120` `min-h-[232px]` を `md:min-h-[232px]` に
- 画像無しカードに `border-l-2 border-l-indigo-100` を追加（視覚的手がかり）
- グリッド `gap-5` → `gap-3 md:gap-5`

**受け入れ基準 (AC)**:
- [ ] `image_url` 無しリンクでタイトル・URL・サービス名が視認できる
- [ ] `image_url` ありリンクは従来どおり画像サムネ付き
- [ ] 375px で縦スクロール時に各リンクが1枚ずつ識別可能（空白カード無し）
- [ ] 1280px で `xl:grid-cols-3` 維持、1カラム見た目が破綻しない

**検証**:
1. 実データの Links を `npm run dev` でレンダリング
2. image_url あり/なしの両方が混在していることを確認（無ければ Slack で OGP 無し URL を自 DM に投稿→同期）
3. Mobile viewport で縦スクロール、Desktop viewport でグリッド崩れ無し

## チェックポイント

1. **CP1 (Slice A 完了後)**: ヘッダーがモバイルで収まる。コミット可能。ユーザー確認を挟める。
2. **CP2 (Slice B 完了後)**: Links カードが画像無しでも読める。コミット可能。
3. **CP3 (合流)**: Chrome DevTools で 375 / 640 / 768 / 1280 px を最終確認。Vercel デプロイ後にユーザーに実機確認依頼。

## リスクと回避

- **`xs` ブレイクポイント**: Tailwind v4 既定に無い。375px と 640px の間は `sm:` 未満のデフォルトスタイルで吸収する。カスタム追加はしない。
- **ハンバーガーの a11y**: フォーカストラップは簡易実装では省略。代わりに Esc / オーバーレイクリック / ルート遷移での自動クローズで離脱経路を確保。項目数4つなので Tab 周回でも実害小と判断。
- **スクロール位置での sticky 挙動**: ドロワーは Header 直下 `absolute` で出すため、スクロール中に開いても Header に追従する。`overflow: hidden` を body に付けない（ページ固定化は不要）。
- **OGP画像あり/なし混在で高さ不揃い**: グリッドでは意図通り（masonry 不要）。UX 的に許容。

## 検証マトリクス

| 幅 | Header | Links |
| --- | --- | --- |
| 375px (iPhone SE) | 1行 / ハンバーガー / Nav+Sign out はドロワー内 | 1カラム / 画像無しは content のみ |
| 640px (sm) | ハンバーガー消失 / Nav+Sign out 復活 / 同期ラベル復活 / `my-own` 表示 | 1カラム |
| 768px (md) | デスクトップ相当 | 2カラム |
| 1280px (xl) | デスクトップ相当 | 3カラム |
