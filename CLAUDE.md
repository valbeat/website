# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Takuma Kajikawa の個人ポートフォリオ / ブログサイト。素の HTML + CSS のみで構成し、GitHub Pages にデプロイする。ビルドツールやフレームワーク（Next.js, Astro 等）は導入しない方針。

リポジトリは初期化直後で、現時点では `README.md` と `LICENSE` のみ。コンテンツとスタイルはこれから追加していく。

## Tech Stack Constraints

- **HTML / CSS のみ**。JavaScript フレームワーク、ビルドステップ、パッケージマネージャー（npm, pnpm 等）は導入しない
- 必要が出た場合のみ、最小限の素の JavaScript を許容する
- 依存追加・ツールチェーン導入は必ず事前に相談する
- 例外: `package.json` / `node_modules` は **dev 限定の visual regression テスト用途** に限り導入済み（後述）。本体配信ファイルには影響しない
- パッケージマネージャは **pnpm**（`package.json` の `packageManager` フィールドでバージョン固定）
- Node.js のバージョンは `package.json` の `volta.node` フィールド（Volta は `.nvmrc` / `.node-version` を読まないため exact 指定）。CI は `actions/setup-node` の `node-version-file: package.json` で同フィールドを読む
- サプライチェーン対策: `.npmrc` で `ignore-scripts=true`（postinstall 等のライフサイクルスクリプトを全 dep で禁止）。Playwright のブラウザ DL は明示の `playwright install` 経由なので影響なし

## Deployment

- **GitHub Pages** にホスティング
- `main` ブランチへの push がデプロイトリガー（GitHub Pages の設定に従う）
- ビルド出力ディレクトリは存在しない（リポジトリのファイルがそのまま配信される）
- カスタムドメイン: **kajitack.com**（Cloudflare で取得・DNS 管理）
  - GitHub Pages の Custom domain 設定に `kajitack.com` を登録し、`CNAME` ファイルをリポジトリ直下に配置する
  - Cloudflare DNS で apex (`kajitack.com`) は GitHub Pages の A レコード 4 つ、`www` は `valbeat.github.io` への CNAME を設定
  - Cloudflare のプロキシ（オレンジ雲）を有効にする場合、GitHub Pages 側で HTTPS を有効化したうえで Cloudflare 側を **Full (strict)** にする（**Flexible** はリダイレクトループの原因になるので不可）

## Local Preview

ビルドステップが無いため、ローカルでは任意の静的ファイルサーバーで確認する。例:

```bash
python3 -m http.server 8000
# または
npx serve .
```

ブラウザで `http://localhost:8000` を開く。

## Conventions

- ファイル名は kebab-case（例: `about-me.html`, `style.css`）
- 相対パスでリンクを記述し、GitHub Pages のサブパス配信でも壊れないようにする
- 画像は `images/` 等の専用ディレクトリにまとめ、ファイル名でも内容が分かるようにする
- 例外: `favicon.ico` と `apple-touch-icon.png` はブラウザのデフォルト探索に合わせ **リポジトリ直下** に配置する

## Visual Regression Testing

PR ごとに描画スクリーンショットを取得し、PR コメントにインライン表示する仕組みを `.github/workflows/visual-regression.yml` で運用。

### 構成

- **Playwright** で chromium / desktop + mobile viewport × light / dark をキャプチャ
- ベースライン PNG は `tests/visual.spec.js-snapshots/` にコミット
- CI は PR 開く / 更新ごとに走り、結果を **orphan branch `visual-results`** の `pr-N/run-M/` に push
- PR コメント（sticky）に `raw.githubusercontent.com` 経由の URL で画像を埋め込み

### ローカル実行

```bash
pnpm install                 # 初回のみ
pnpm exec playwright install # ブラウザ取得（初回のみ）
pnpm serve &                 # 別シェルでも可
pnpm test:visual             # スナップショット比較
```

ベースラインは Linux/CI 上で生成された PNG なので、ローカル (macOS) で `--update-snapshots` するとフォント描画差で全部書き換わる。**ベースラインは更新しないこと**。

### ベースラインを意図的に更新する

CSS / HTML を変えてスクリーンショットを差し替えたい場合は、GitHub Actions の `Update Visual Snapshots` ワークフローを **workflow_dispatch** で対象ブランチを指定して実行する。CI が `--update-snapshots` で再生成し、同ブランチに `chore: update visual regression baselines` で push する。

### 新規テスト追加 / 削除

- テストは `tests/visual.spec.js`。viewport / テーマの組み合わせをループで展開している
- テスト名から決まるベースラインファイル名を変えると古い PNG が孤立するので、`tests/visual.spec.js-snapshots/` の不要ファイルは合わせて削除する

このプロジェクトでは設定ファイルやコマンドが追加された段階で、このドキュメントを更新する。
