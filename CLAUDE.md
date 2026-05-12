# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Takuma Kajikawa の個人ポートフォリオ / ブログサイト。素の HTML + CSS のみで構成し、GitHub Pages にデプロイする。ビルドツールやフレームワーク（Next.js, Astro 等）は導入しない方針。

リポジトリは初期化直後で、現時点では `README.md` と `LICENSE` のみ。コンテンツとスタイルはこれから追加していく。

## Tech Stack Constraints

- **HTML / CSS のみ**。JavaScript フレームワーク、ビルドステップ、パッケージマネージャー（npm, pnpm 等）は導入しない
- 必要が出た場合のみ、最小限の素の JavaScript を許容する
- 依存追加・ツールチェーン導入は必ず事前に相談する

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

このプロジェクトでは設定ファイルやコマンドが追加された段階で、このドキュメントを更新する。
