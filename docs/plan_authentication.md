# 認証機能 実現可能性調査・計画書

作成日: 2026-06-14

---

## 1. 前提：GitHub Pages の制約

現在のデプロイ構成は以下のとおり。

| 項目 | 現状 |
|------|------|
| ホスティング | GitHub Pages |
| ビルド形式 | 静的エクスポート（`output: "export"`） |
| サーバーサイド処理 | **不可**（静的HTMLファイルの配信のみ） |
| HTTPS | ✅ 対応済み（Passky/WebAuthn の必須要件） |

**重要な制約：** GitHub Pages はサーバーサイドコードを実行できない。
そのため、認証の検証ロジックをサーバーで持てないという根本的な制限がある。

---

## 2. 認証方式と実現可能性

### 2-1. Passkey（WebAuthn）

WebAuthn は以下の要素が必要：

- ブラウザ ↔ サーバー間でチャレンジ・レスポンスをやり取りする
- 公開鍵をサーバーDB に保存する
- 認証時にサーバーが署名を検証する

**→ 純粋なクライアントサイドのみでは実現不可。何らかのバックエンドが必須。**

### 2-2. Google OAuth

Google ログインは OAuth 2.0 フローで以下が必要：

- コールバックURL（`redirect_uri`）が必要
- Google がリダイレクトする先のサーバー or 外部サービスが必要

**→ そのままでは不可。ただし外部認証サービス経由なら可能。**

---

## 3. 選択肢の比較

GitHub Pages に留まりながら認証を実現するには、**外部認証 BaaS（Backend as a Service）** を利用する。

| サービス | Google ログイン | Passkey | GitHub Pages対応 | 無料枠 | 実装難易度 |
|----------|:-:|:-:|:-:|------|:---:|
| **Firebase Auth** | ✅ | ✅ (新機能) | ✅ | 十分 | 中 |
| **Clerk** | ✅ | ✅ | ✅ | 月10,000 MAU | **低** |
| **Auth0** | ✅ | ✅ | ✅ | 月25,000 MAU | 中 |
| **Supabase Auth** | ✅ | ❌ | ✅ | 十分 | 中 |

---

## 4. セキュリティ上の重要な注意点

**GitHub Pages（静的サイト）での認証は「UIレベルの保護」に留まる。**

```
通常のSSRアプリ:  ブラウザ → サーバー → 認証チェック → コンテンツ返却
GitHub Pages:    ブラウザ → 全コンテンツをそのままダウンロード → JS で表示制御
```

- ブラウザのDevToolsや直リンクでJSをスキップすれば技術的にはアクセス可能
- **個人ツールとして「誰でも使えないようにしたい」程度の用途なら十分**
- 機密データを守りたい場合は後述のプラットフォーム移行が必要

---

## 5. 実装アプローチ（2 案）

---

### 案 A：GitHub Pages に留まる ＋ Clerk（推奨）

**概要：** 認証サーバーを Clerk に完全委託。クライアントSDKで制御。

```
ユーザー → GitHub Pages（静的サイト）
             ↓ ログインボタン
           Clerk（認証処理）
             ↓ トークン返却
           ページコンテンツ表示
```

**メリット：**
- GitHub Pages のまま変更不要
- Passkey + Google ログインの両方に対応
- 実装が最も簡単（UIコンポーネント付属）
- 無料枠で個人ツールは十分

**デメリット：**
- クライアントサイド保護のみ（上記注意点）
- Clerk の外部サービス依存

**実装ステップ：**

1. [Clerk](https://clerk.com) でアカウント作成・アプリ登録
2. Google OAuth を Clerk の設定で有効化
3. パッケージ追加: `yarn add @clerk/nextjs`
4. `ClerkProvider` で `layout.tsx` をラップ
5. 未ログインユーザーを `/sign-in` にリダイレクト（client-side）
6. `useUser()` フックで認証状態を管理
7. Clerk の `<SignIn />` / `<UserButton />` コンポーネントを配置
8. Clerk の Allowed origins に `https://<username>.github.io` を追加

**必要な変更ファイル：**
- `_application/src/app/layout.tsx`（ClerkProvider追加）
- `_application/src/app/page.tsx`（認証ガード追加）
- `_application/src/app/sign-in/page.tsx`（新規作成）
- `_application/.env.local`（Clerk APIキー）

---

### 案 B：Vercel に移行 ＋ Next.js Middleware で認証（より強固）

**概要：** GitHub Pages から Vercel に移行することでサーバーサイド認証が可能になる。

```
ユーザー → Vercel（Edge Middleware）
             ↓ 認証チェック（サーバーサイド）
             ↓ 未認証なら /sign-in にリダイレクト
           ページコンテンツ返却
```

**メリット：**
- サーバーサイドで認証チェックのため迂回不可
- Next.js の機能をフル活用（SSR/SSG ハイブリッドも可能）
- Clerk の Middleware との相性が最高

**デメリット：**
- GitHub Pages → Vercel への移行作業が必要
- `output: "export"` の設定変更が必要（Middleware は export 非対応）
- GitHub Actions の workflow 変更が必要
- ただし移行自体は比較的簡単

**Vercel 移行手順（概要）：**
1. `next.config.mjs` から `output: "export"` を削除
2. basePath/assetPrefix の設定見直し
3. Vercel アカウント作成 → GitHub リポジトリ連携
4. `_application/` をルートとして設定
5. GitHub Actions workflow を Vercel 用に変更（または Vercel の自動デプロイに任せる）

---

## 6. 推奨：どちらを選ぶか

| 観点 | 案 A（GitHub Pages + Clerk） | 案 B（Vercel移行 + Clerk） |
|------|------|------|
| 移行コスト | 低（既存構成そのまま） | 中（設定変更・workflow更新） |
| 認証の強度 | UI保護のみ | サーバーサイド保護 |
| 用途 | 個人ツールの簡易制限 | 確実なアクセス制御 |
| 維持コスト | 低 | 低（Vercel 無料枠） |

**→ 個人の制作ツールとしての利用なら「案 A」で十分。**
**→ 「誰かにこのツールを使われたくない」を確実に守りたいなら「案 B」を推奨。**

---

## 7. 今後の決定事項

実装着手前に以下を確認する：

- [ ] どちらの案で進めるか（A: GitHub Pages継続 / B: Vercel移行）
- [ ] 認証の目的（自分専用に使いたいのか、複数人で使えるようにしたいのか）
- [ ] Passkey と Google ログインは両方必要か、どちらか一方でよいか
- [ ] Clerk 以外のサービス（Firebase Auth等）の方が好ましいか
