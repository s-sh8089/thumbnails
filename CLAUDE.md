# カスタマイズ

## 基本ルール

- 必ず日本語で応答すること。
- 必ず計画を立てて文書化すること。
- 変更完了後は必ず結果に関するレポートを作成すること。

## プロジェクト概要

Next.js 14（App Router）+ TypeScript製のサムネイル生成ツール。
ベース画像とデコレーション画像（PNG）をCanvas APIで合成し、JPEG形式で保存できる完全クライアントサイドのSPAツール。
静的エクスポート（`output: "export"`）構成で、バックエンド不要。

## 技術スタック

- Frontend: Next.js 14 (App Router), React 18, TypeScript
- UIコンポーネント: MUI (Material UI v5) + Emotion
- CSS: SCSS（CSS Modules）、グローバルスタイル (`globals.scss`)
- CSSリセット: the-new-css-reset
- フォント: Inter（next/font/google）
- Tailwind CSS: インストール済みだが現在は未使用
- パッケージマネージャー: yarn 1.22.22（corepack 経由）

## コマンド

- 開発サーバー起動（Docker）: `docker-compose up`（port 3000、ルートで実行）
- 開発サーバー起動（ローカル）: `cd _application && yarn dev`（port 3000）
- ビルド（静的エクスポート）: `cd _application && yarn build`
- 本番サーバー起動: `cd _application && yarn start`
- Lint: `cd _application && yarn lint`
- パッケージ追加: `cd _application && yarn add <package>`

## 開発環境

- Dockerを使った開発が基本（コンテナ名: `thumbnails`）
- Dockerfileは `./_docker/Dockerfile`、アプリコードは `./_application/` にマウント
- ローカル直接開発の場合は `_application/` 内で `npm run dev` を実行

## アーキテクチャルール

- 完全クライアントサイド — バックエンドAPI・外部サービスなし
- Canvas APIで画像合成を行い、ファイルをローカル保存
- ページ内でのみ状態管理（useState/useRef）が基本
- グローバル状態が必要な場合はContext API（`src/app/_context/`配下）を使用
- 外部状態管理ライブラリ（Pinia等）は使用しない

## コーディング規約

- TypeScript strict mode 必須（`tsconfig.json` で設定済み）
- any 型は原則禁止
- React Hooks + クライアントコンポーネント（`"use client"`）を使用
- 非同期処理は async/await（Promiseチェーン禁止）
- コメントは日本語で書く
- CSS Modulesを使いSCSSを記述（グローバルクラスは使わない）

## ディレクトリ構成

```
（リポジトリルート）
├── _application/         # アプリケーションコード（Next.js プロジェクト本体）
│   ├── src/app/
│   │   ├── components/       # 再利用可能なUIコンポーネント（footer/header/infoText等）
│   │   ├── styles/           # グローバルSCSS変数・mixin
│   │   ├── selectBackgroundImg/  # 開発中ページ（背景画像選択機能）
│   │   ├── globals.scss
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── page.module.scss
│   ├── public/
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── package.json
├── _docker/              # Dockerビルド用ファイル
│   └── Dockerfile
├── .github/workflows/    # GitHub Actions
│   └── nextjs.yml
└── docker-compose.yml
```

## 重要ファイル

- Next.js設定: `_application/next.config.mjs`（静的エクスポート、GitHub Pages用basePath）
- TypeScript設定: `_application/tsconfig.json`
- メインページ: `_application/src/app/page.tsx`（Canvas合成ロジック）
- レイアウト: `_application/src/app/layout.tsx`
- SCSS変数: `_application/src/app/styles/_variables.scss`（パスエイリアス `@variables`）
- SCSSミックスイン: `_application/src/app/styles/_mixin.scss`（パスエイリアス `@mixin`）

## パスエイリアス

- `@/*` → `./src/*`
- `@variables` → `./src/app/styles/_variables.scss`
- `@mixin` → `./src/app/styles/_mixin.scss`

## 禁止事項

- console.log をコミットに含める
- npm audit で HIGH以上の脆弱性があるパッケージの追加
- mainブランチへの直接push（PRを経由すること）
- TypeScript の `any` 型の使用

## Git運用

- リモート: GitHub（`git@github.com:s-sh8089/thumbnails.git`）
- ブランチ命名: feature/xxx, fix/xxx, chore/xxx
- コミットメッセージ: Conventional Commits形式
  例: feat: 背景画像選択ページを追加
- PRはmainブランチへ

## 環境

- 開発: http://localhost:3000
