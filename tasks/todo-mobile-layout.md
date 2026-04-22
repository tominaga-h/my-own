# TODO: モバイル表示破綻の修正

Plan: `tasks/plan-mobile-layout.md`

## Slice A — Header にハンバーガーメニューを導入

- [ ] A1. コンテナ余白を `px-3 sm:px-5` に変更
  - AC: 375px viewport で左右 padding 12px
- [ ] A2. ロゴテキスト `my-own` を `hidden sm:inline` で `sm:` 未満非表示
  - AC: モバイルは画像のみ、640px以上で文字復活
- [ ] A3. 既存 `<nav>` に `hidden sm:flex`、`Sign out` ボタンに `hidden sm:inline-flex` 付与
  - AC: モバイルでは Nav / Sign out が Header 本体から消える
- [ ] A4. 同期ボタンのテキスト (`同期中…`/`同期`) を `<span className="hidden sm:inline">` で包む
  - AC: モバイルでアイコンのみ、`aria-label` 残置
- [ ] A5. 右側コンテナに `flex-nowrap`、`gap-3` → `gap-1 sm:gap-3`
  - AC: `flex-wrap: nowrap` 適用、モバイルでも要素間が詰まる
- [ ] A6. ハンバーガートグルボタンを追加 (`sm:hidden`)
  - AC: `aria-expanded`, `aria-controls="mobile-nav"`, `aria-label="メニュー"` 付き。タップ領域 ≥ 40×40px
- [ ] A7. ドロワーパネルを追加 (`id="mobile-nav"`, `sm:hidden`)
  - AC: Header 直下に展開、Nav 3項目 + Sign out をタップしやすい縦並び (`py-3 px-4`) で配置
- [ ] A8. 背景オーバーレイ + クリックで閉じる
  - AC: 半透明背景タップでドロワー閉じる
- [ ] A9. `useState<boolean>` で開閉、`useEffect` で `pathname` 変化時に自動クローズ
  - AC: リンクタップ → 遷移 → ドロワー閉じる
- [ ] A10. `Esc` キーで閉じる (`keydown` リスナ)
  - AC: 開いた状態で Esc 押下 → 閉じる
- [ ] A11. **検証**: Chrome DevTools Mobile (375×667) で /tasks /notes /links
  - AC: ハンバーガー開閉、リンク遷移後自動クローズ、Esc/オーバーレイで閉じる
- [ ] A12. **検証**: 640px に広げるとハンバーガー消失・従来 Nav 出現
  - AC: `sm:` 境界で切り替わる
- [ ] A13. **検証**: Desktop (1280px) 回帰無し
  - AC: ロゴテキスト・Nav ラベル・同期ラベル・Sign out すべて従来表示

### Checkpoint 1
Header コミット可。ユーザー確認を挟んでも良い。

## Slice B — Links カードを画像有無で出し分け

- [ ] B1. `app/links/page.tsx` `imageUrl` null 時は画像エリア `<div>/<a>` を描画しない分岐
  - AC: 画像無しリンクはカード上部の空 gradient が消える
- [ ] B2. サービス名バッジを content 先頭行 (`#{row.id}` と並ぶ行) に併置（画像無し時のみでも可）
  - AC: 画像無しカードでもサービス名が視認できる
- [ ] B3. `min-h-[232px]` を `md:min-h-[232px]` に
  - AC: 375px で短い description のカードが無駄に背高くならない
- [ ] B4. 画像無しカードに `border-l-2 border-l-indigo-100` 付与
  - AC: 白一色のカードに視覚的手がかりが1本入る
- [ ] B5. グリッド `gap-5` → `gap-3 md:gap-5`
  - AC: 375px で縦の空白が詰まる
- [ ] B6. **検証**: Mobile viewport で /links 目視
  - AC: image_url あり/なし両方のリンクが識別可能
- [ ] B7. **検証**: Desktop (1280px) で `xl:grid-cols-3` 崩れ無し
  - AC: 3カラム、`min-h-[232px]` で高さ揃う

### Checkpoint 2
Links コミット可。

## 合流 — 実機確認

- [ ] M1. Chrome DevTools で iPhone SE / iPhone 14 Pro / iPad Mini を回遊
  - AC: どの幅でも横スクロール無し・主要導線にアクセス可
- [ ] M2. Vercel デプロイ後、ユーザーに実機 iPhone で確認依頼
  - AC: ユーザーOK
- [ ] M3. 追加調整が必要なら follow-up として記録（本スコープ外）

### Checkpoint 3
完了。main マージ。
