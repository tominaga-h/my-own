# TODO: モバイル表示破綻の修正

Plan: `tasks/plan-mobile-layout.md`

## Slice A — Header にハンバーガーメニューを導入

- [x] A1. コンテナ余白を `px-3 sm:px-5` に変更
- [x] A2. ロゴテキスト `my-own` を `hidden sm:inline` で `sm:` 未満非表示
- [x] A3. 既存 `<nav>` に `hidden sm:flex`、`Sign out` ボタンに `hidden sm:inline-flex` 付与
- [x] A4. 同期ボタンのテキスト (`同期中…`/`同期`) を `<span className="hidden sm:inline">` で包む
- [x] A5. 右側コンテナに `flex-nowrap`、`gap-3` → `gap-1 sm:gap-3`
- [x] A6. ハンバーガートグルボタンを追加 (`sm:hidden`, `aria-expanded/controls/label`)
- [x] A7. ドロワーパネルを追加 (`id="mobile-nav"`, 縦並び `py-3 px-4`)
- [x] A8. 背景オーバーレイ + クリックで閉じる
- [x] A9. `useState` + `useEffect` で `pathname` 変化時に自動クローズ
- [x] A10. `Esc` キーで閉じる
- [ ] A11. **検証**: Chrome DevTools Mobile (375×667) で /tasks /notes /links（ユーザー側で確認）
- [ ] A12. **検証**: 640px でハンバーガー消失・従来 Nav 出現（ユーザー側で確認）
- [ ] A13. **検証**: Desktop (1280px) 回帰無し（ユーザー側で確認）

### Checkpoint 1
Header コミット可。ユーザー確認を挟んでも良い。

## Slice B — Links カードを画像有無で出し分け

- [x] B1. `imageUrl` null 時は画像エリアを描画しない分岐
- [x] B2. サービス名バッジを content 先頭行に併置（画像無し時のみ）
- [x] B3. `min-h-[232px]` を `md:min-h-[232px]` に
- [x] B4. 画像無しカードに `border-l-2 border-l-indigo-200` 付与
- [x] B5. グリッド `gap-5` → `gap-3 md:gap-5`
- [ ] B6. **検証**: Mobile viewport で /links 目視（ユーザー側で確認）
- [ ] B7. **検証**: Desktop (1280px) で `xl:grid-cols-3` 崩れ無し（ユーザー側で確認）

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
