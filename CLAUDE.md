# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Takuma Kajikawa の個人ポートフォリオ / ブログサイト。素の HTML + CSS のみで構成し、Cloudflare Workers (static assets) にデプロイする。ビルドツールやフレームワーク（Next.js, Astro 等）は導入しない方針。

## Tech Stack Constraints

- **HTML / CSS のみ**。JavaScript フレームワーク、ビルドステップ、パッケージマネージャー（npm, pnpm 等）は導入しない
- 必要が出た場合のみ、最小限の素の JavaScript を許容する
- 依存追加・ツールチェーン導入は必ず事前に相談する
- 例外: `package.json` / `node_modules` は **dev 限定ツール（visual regression テストと wrangler によるデプロイ）** に限り導入済み（後述）。本体配信ファイルには影響しない（`.assetsignore` で配信対象から除外）
- パッケージマネージャは **pnpm**（`package.json` の `packageManager` フィールドでバージョン固定）
- Node.js のバージョンは `package.json` の `volta.node` フィールド（Volta は `.nvmrc` / `.node-version` を読まないため exact 指定）。CI は `actions/setup-node` の `node-version-file: package.json` で同フィールドを読む
- サプライチェーン対策: `.npmrc` で
  - `ignore-scripts=true` — postinstall 等のライフサイクルスクリプトを全 dep で禁止。Playwright のブラウザ DL は明示の `playwright install` 経由なので影響なし
  - `minimum-release-age=4320`（3 日）— 公開直後の新版を install させない。乗っ取り公開直後のマルウェアをコミュニティが取り下げる猶予を稼ぐ
- ビルドスクリプトを持つ推移的依存（wrangler 経由の esbuild / sharp / workerd）は `pnpm-workspace.yaml` の `allowBuilds` で実行を**明示的に拒否**している。pnpm 11 は未申告だとインストールをエラーにするため、該当依存が増えたら同ファイルに `false` で追記する

## Deployment

- **Cloudflare Workers (static assets)** にホスティング。設定は `wrangler.jsonc`
- `main` への push で `.github/workflows/deploy.yml` が `wrangler deploy` を実行（手動再デプロイは workflow_dispatch）
- ビルドステップは無く、リポジトリのファイルがそのままアップロードされる。**dev 用ファイルは `.assetsignore` で配信対象から除外**しているので、配信すべきでないファイル・ディレクトリを追加したら必ず追記する（漏れると本番で公開される）
- 404 は `wrangler.jsonc` の `assets.not_found_handling: "404-page"` により `404.html` を配信（GitHub Pages の custom 404 と同等の挙動）
- 必要な GitHub Secrets: `CLOUDFLARE_API_TOKEN`（Account > Workers Scripts: Edit 権限）と `CLOUDFLARE_ACCOUNT_ID`
- カスタムドメイン: **kajitack.com**（Cloudflare で取得・DNS 管理）。apex と `www` を Workers のカスタムドメインとして紐づける（同一 Cloudflare 内なので DNS レコード・証明書は自動管理）
- 静的アセット配信はリクエスト数・帯域とも無制限・無料（Workers Free プランの 10 万 req/日制限は Worker スクリプト実行分のみで、静的配信には適用されない）

### GitHub Pages からのカットオーバー手順（移行完了まで）

workers.dev のサブドメインは登録せず（`workers_dev: false`）、カスタムドメインを直接紐づける方式を取る。

1. ~~GitHub Secrets に `CLOUDFLARE_API_TOKEN`（Workers Scripts:Edit のみの最小権限）/ `CLOUDFLARE_ACCOUNT_ID` を登録~~（済）
2. `wrangler deploy` の成功を確認（この時点では Worker にアクセス経路は無い）
3. Cloudflare ダッシュボードの Workers & Pages → kajitack-website → Settings → Domains & Routes で `kajitack.com` / `www.kajitack.com` をカスタムドメインとして追加（GitHub Pages 向けの既存 A / CNAME レコードを置き換え。**この操作がカットオーバーそのもの**）
4. `https://kajitack.com` で表示・404・言語自動判定を確認。問題があればダッシュボードでドメインを外せば GitHub Pages に戻る
5. GitHub リポジトリ設定で Pages を無効化し、`CNAME` ファイルと `.assetsignore` の `CNAME` 行を削除する（別 PR）

## Local Preview

ビルドステップが無いため、ローカルでは任意の静的ファイルサーバーで確認する。例:

```bash
python3 -m http.server 8000
# または
npx serve .
```

ブラウザで `http://localhost:8000` を開く。

本番同等の挙動（`.assetsignore` の除外、`404.html` の配信）まで確認したい場合は wrangler を使う:

```bash
pnpm exec wrangler dev --port 8787
```

## Conventions

- ファイル名は kebab-case（例: `about-me.html`, `style.css`）
- 相対パスでリンクを記述し、GitHub Pages のサブパス配信でも壊れないようにする
- 画像は `images/` 等の専用ディレクトリにまとめ、ファイル名でも内容が分かるようにする
- 例外: `favicon.ico` と `apple-touch-icon.png` はブラウザのデフォルト探索に合わせ **リポジトリ直下** に配置する

## Internationalization (i18n)

日本語⇄英語は **言語別の静的ページ + hreflang** で提供する（i18n ライブラリは使わない）。

- 言語ごとに独立した HTML を持つ: `/`（日本語・正準 / x-default）と `/en/`（英語）
- 両ページの `<head>` に `<link rel="alternate" hreflang>`（`ja` / `en` / `x-default`）と `og:locale` を相互に張る。各ページの `canonical` は自分自身
- **`/en/` 配下はサブディレクトリなので、アセット参照は `../` 相対パス**（`../style.css`, `../images/...`, `../favicon.ico`）。`/` 直下は従来どおり `./`
- 初回訪問の自動言語判定はルート `/` の `<head>` 内 IIFE でのみ行う（`localStorage.lang` 未設定 かつ `navigator.language` が英語なら `/en/` へ `location.replace`）。`/en/` 側では判定しない（リダイレクトループ防止）。言語スイッチャーのクリックで `localStorage.lang` を保存し、以降の自動判定を抑止する
- **`404.html` は日英併記**（GitHub Pages 時代の制約に由来）。Cloudflare Workers の `not_found_handling: "404-page"` は最寄りの `404.html` を探すため、将来 `/en/404.html` を置いて言語別 404 に分けることも可能
- `sitemap.xml` は全言語 URL を列挙し、各 `<url>` に `xhtml:link rel="alternate" hreflang` を付ける
- 新しい言語別ページを追加したら、`tests/visual.spec.js` に対応する VRT を足す（ベースラインは CI で生成）

## OGP Image

`images/og.png`（1200×630, 8-bit sRGB）は手書きせず、テンプレートから生成する。

- テンプレート: `tools/og/template.html`（色・フォントは `style.css` と揃える）
- 生成: `pnpm og:generate`（Playwright chromium で 1200×630 をスクリーンショット）
- 文言やデザインを変えたらテンプレートを編集 → 再生成してコミットする
- 生成はローカル (macOS) で行う前提（フォントはシステムの Hiragino Sans に依存）。OGP 画像はページ描画に出ないため VRT ベースラインには影響しない

## Visual Regression Testing

PR ごとに描画スクリーンショットを取得し、PR コメントにインライン表示する仕組みを `.github/workflows/visual-regression.yml` で運用。

### 構成

- **Playwright** で chromium / desktop + mobile viewport × light / dark をキャプチャ
- ベースライン PNG は `tests/visual.spec.js-snapshots/` にコミット
- CI は PR 開く / 更新ごとに走り、結果を **orphan branch `visual-results`** の `pr-N/run-M/` に push
- PR コメント（sticky）に `raw.githubusercontent.com` 経由の URL で画像を埋め込み
- `visual` ジョブは **全 PR で起動**（`paths` フィルタ無し）。描画に関係するパス（html/css/js, `images/`, `tests/`, playwright 設定, lockfile 等）に変更が無ければ Playwright を回さず success で終える。これにより `visual` を **必須ステータスチェック**にしても対象外 PR が *skipped* で詰まらない
- `main` のブランチ保護で `visual` を required status check に設定済み。**VRT が赤の PR は auto-merge できない**（意図的なビジュアル変更は後述の手順でベースラインを緑にしてからマージする）

### ローカル実行

```bash
pnpm install                 # 初回のみ
pnpm exec playwright install # ブラウザ取得（初回のみ）
pnpm serve &                 # 別シェルでも可
pnpm test:visual             # スナップショット比較
```

ベースラインは Linux/CI 上で生成された PNG なので、ローカル (macOS) で `--update-snapshots` するとフォント描画差で全部書き換わる。**ベースラインは更新しないこと**。

### ベースラインを意図的に更新する

CSS / HTML を変えてスクリーンショットを差し替えたい場合は、`Update Visual Snapshots` ワークフローを **更新したい PR ブランチ上で** dispatch する:

```bash
gh workflow run "Update Visual Snapshots" --ref <pr-branch>
```

ワークフローは dispatch 先ブランチ（`github.ref`）をそのまま checkout / push 対象にするので、`--ref` で渡したブランチ＝ベースライン更新先になる（input は無い）。CI が `--update-snapshots` で再生成し、同ブランチに `chore: update visual regression baselines` で push → VRT が緑になりマージ可能になる。

- **`--ref` の渡し忘れに注意していた旧仕様（`inputs.ref` デフォルト `main`）は廃止済み**。誤って `main` を指定しても実行は拒否される（保険のガード）
- `main` のベースラインを直接書き換えることは想定しない。必ず PR ブランチ経由で更新する

### 新規テスト追加 / 削除

- テストは `tests/visual.spec.js`。viewport / テーマの組み合わせをループで展開している
- テスト名から決まるベースラインファイル名を変えると古い PNG が孤立するので、`tests/visual.spec.js-snapshots/` の不要ファイルは合わせて削除する

このプロジェクトでは設定ファイルやコマンドが追加された段階で、このドキュメントを更新する。
