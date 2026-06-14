# 文字オーバーレイ機能 実装計画書

作成日: 2026-06-14

---

## 1. 機能概要

### 現在のフロー
```
画像選択 → 作成 → [保存 / リセット]
```

### 追加後のフロー
```
画像選択 → 作成 → [保存 / 文字を入れる / リセット]
                        ↓
               文字編集ページ（/text-editor）
               ┌─────────────────────────┐
               │ プレビュー（Canvas）      │
               │ フォント選択             │
               │ 文字色選択              │
               │ フォントサイズ           │
               │ 文字入力                │
               │ [ダウンロード / 戻る]    │
               └─────────────────────────┘
                        ↓
               タイムスタンプ.jpeg でダウンロード
```

---

## 2. 画面設計

### 2-1. メインページ（page.tsx）への追加

`generatedFlag === true` のとき、保存ボタンの隣に **「文字を入れる」** ボタンを追加。

```
[作成] → 生成後 → [保存] [文字を入れる]  [リセット]
```

### 2-2. 文字編集ページ（/text-editor）

| エリア | 内容 |
|--------|------|
| プレビュー | 現在のキャンバス画像 + 入力中テキストをリアルタイム合成 |
| フォント | セレクトボックス（選択肢は下記参照） |
| 文字色 | カラーピッカー（`<input type="color">`） |
| フォントサイズ | スライダー or 数値入力（px単位、例: 20〜200px） |
| 文字列 | テキストエリア（複数行対応か単行かは後述） |
| 位置 | プリセット9パターン（左上/中上/右上 / 左中/中央/右中 / 左下/中下/右下） |
| ボタン | [ダウンロード] [戻る] |

---

## 3. アーキテクチャ方針

### 3-1. ページ間のデータ受け渡し

文字編集ページは独立した Next.js ルート（`/text-editor`）として作成する。
メインページで生成した Canvas の画像データ（`toDataURL()`）を渡す手段として **Context API** を使用する。

```
ThumbnailContext（Context API）
  ├── canvasDataUrl: string | undefined  ← page.tsx でセット
  └── 文字編集ページから参照
```

※ localStorage や URL パラメータは base64 データが大きいため不適。

### 3-2. 文字描画

文字編集ページ内の Canvas に以下の順で描画する。
1. ベース画像（Context から取得した dataURL）を描画
2. 入力テキスト・フォント・色・サイズ・位置をもとに `ctx.fillText()` で文字を合成
3. 入力のたびにリアルタイム再描画（`useEffect` で監視）

---

## 4. フォント選択肢（案）

ブラウザ標準フォント + Google Fonts（`next/font/google` で読み込み済みのもの）を使用。
追加ロードなしで使えるシステムフォントを優先する。

| 表示名 | CSS font-family |
|--------|-----------------|
| Sans Serif（デフォルト） | `sans-serif` |
| Serif | `serif` |
| Monospace | `monospace` |
| Impact | `Impact, fantasy` |
| ※追加候補 | Noto Sans JP、Zen Kaku Gothic New 等（要 Google Fonts 追加） |

→ 日本語テキストを入れる想定か否かで選択肢が変わるため、**要確認**。

---

## 5. 実装ステップ

### Step 1: Context API の作成
- ファイル: `_application/src/app/_context/ThumbnailContext.tsx`
- `canvasDataUrl` と `setCanvasDataUrl` を提供

### Step 2: layout.tsx に Provider を追加
- `_application/src/app/layout.tsx` を `ThumbnailProvider` でラップ

### Step 3: page.tsx に「文字を入れる」ボタンを追加
- `generatedFlag === true` のタイミングで Canvas を `toDataURL()` して Context にセット
- `useRouter` で `/text-editor` に遷移

### Step 4: 文字編集ページの作成
- `_application/src/app/text-editor/page.tsx`
- `_application/src/app/text-editor/page.module.scss`
- プレビュー Canvas、各コントロール UI、ダウンロード処理

### Step 5: ダウンロード処理
- ファイル名: `YYYY-MM-DD_HH-mm-ss.jpeg`（既存の `fileSaveHandler` と同形式）
- `canvas.toDataURL('image/jpeg', 0.7)` で出力

---

## 6. 変更・新規作成ファイル一覧

| 種別 | パス |
|------|------|
| 新規 | `_application/src/app/_context/ThumbnailContext.tsx` |
| 新規 | `_application/src/app/text-editor/page.tsx` |
| 新規 | `_application/src/app/text-editor/page.module.scss` |
| 変更 | `_application/src/app/layout.tsx` |
| 変更 | `_application/src/app/page.tsx` |

---

## 7. 実装前の確認事項

- [ ] 文字は**単行のみ**か、**複数行**入力も必要か
- [ ] 文字の位置は**プリセット9パターン**か、**自由ドラッグ**か
- [ ] **日本語フォント**は必要か（不要なら追加 Google Fonts ロード不要）
- [ ] フォントの選択肢は何種類程度必要か
- [ ] 「戻る」を押したとき、メインページの状態（生成済みキャンバス）は維持するか

---

## 8. 非機能要件

- TypeScript strict モード準拠（`any` 型禁止）
- SCSS Modules でスタイリング（グローバルクラス禁止）
- コメントは日本語
- MUI コンポーネントを UI パーツに使用（既存に合わせる）
