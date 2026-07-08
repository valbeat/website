# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Takuma Kajikawa の個人ポートフォリオ / ブログサイト。**Astro** で静的サイトとしてビルドし（SSR は使わない）、Cloudflare Workers (static assets) にデプロイする。

## Tech Stack Constraints

- **Astro（静的出力）+ 素の CSS**。配信物はゼロ JS の静的 HTML（テーマ切替・言語判定の最小限のインライン JS のみ）。React 等の UI フレームワークや client-side ランタイムは載せない
- ソースは `src/`（`layouts/` `components/` `pages/`）、静的アセットは `public/`（ビルド時に `dist/` 直下へコピー）、ビルド出力は `dist/`（gitignore、Workers 配信対象）
- 依存追加は最小限に。UI フレームワーク・重い Astro インテグレーションの導入は事前に相談する
- パッケージマネージャは **pnpm**（`package.json` の `packageManager` フィールドでバージョン固定）
- Node.js のバージョンは `package.json` の `volta.node` フィールド（Volta は `.nvmrc` / `.node-version` を読まないため exact 指定）。CI は `actions/setup-node` の `node-version-file: package.json` で同フィールドを読む
- サプライチェーン対策: `.npmrc` で
  - `ignore-scripts=true` — postinstall 等のライフサイクルスクリプトを全 dep で禁止。Playwright のブラウザ DL は明示の `playwright install` 経由なので影響なし
  - `minimum-release-age=4320`（3 日）— 公開直後の新版を install させない。乗っ取り公開直後のマルウェアをコミュニティが取り下げる猶予を稼ぐ
- ビルドスクリプトを持つ推移的依存（esbuild / sharp / workerd 等）は `pnpm-workspace.yaml` の `allowBuilds` で実行を**明示的に拒否**している。pnpm 11 は未申告だとインストールをエラーにするため、該当依存が増えたら同ファイルに `false` で追記する

## Deployment

- **Cloudflare Workers (static assets)** にホスティング。設定は `wrangler.jsonc`（配信対象は `assets.directory: "./dist"`）
- `main` への push で `.github/workflows/deploy.yml` が `pnpm build`（Astro ビルド）→ `wrangler deploy` を実行（手動再デプロイは workflow_dispatch）
- 配信されるのは `dist/` の中身のみ。`dist/` はビルド成果物だけで dev 用ファイルを含まないため、`.assetsignore` は不要（廃止済み）
- 404 は `wrangler.jsonc` の `assets.not_found_handling: "404-page"` により `dist/404.html`（Astro が `src/pages/404.astro` から生成）を配信
- 必要な GitHub Secrets: `CLOUDFLARE_API_TOKEN`（Account > Workers Scripts: Edit 権限）と `CLOUDFLARE_ACCOUNT_ID`
- カスタムドメイン: **kajitack.com**（Cloudflare で取得・DNS 管理）。apex を Workers のカスタムドメインとして紐づけ済み。`www` は apex への CNAME（プロキシ）が残っており、Cloudflare が自動で `https://kajitack.com/` へ 301 リダイレクトする（www 用の独立カスタムドメインは不要）
- 静的アセット配信はリクエスト数・帯域とも無制限・無料（Workers Free プランの 10 万 req/日制限は Worker スクリプト実行分のみで、静的配信には適用されない）
- workers.dev サブドメインは登録せず（`workers_dev: false` / `preview_urls: false`）、入口は kajitack.com のみ

### GitHub Pages からの移行（完了済み）

2026-07 に GitHub Pages から Cloudflare Workers へ移行完了。カットオーバーは Cloudflare DNS の apex A レコード（GitHub Pages 向け 185.199.108〜111.153）を削除 → Workers のカスタムドメインに kajitack.com を追加、という手順で実施した。移行時の検証: apex 200 / 404 ページ / `/en/` 200 / www 301→apex / Let's Encrypt 証明書、すべて確認済み。

ロールバックが必要な場合は、Cloudflare DNS に apex A レコード 4 つ（185.199.108.153 / 109 / 110 / 111）を戻し、Workers のカスタムドメインを外せば GitHub Pages に戻せる（GitHub Pages 側の設定を再有効化する前提）。

## Local Preview

```bash
pnpm dev        # Astro dev サーバー（HMR あり、http://localhost:4321）
pnpm build      # dist/ を生成
pnpm preview    # ビルド済み dist/ を本番同等に配信
```

本番（Workers）同等の 404 挙動まで確認したい場合は wrangler:

```bash
pnpm build && pnpm exec wrangler dev --port 8787
```

## Conventions

命名は Astro のベストプラクティスに合わせる:

- **コンポーネント / レイアウトは PascalCase**（`BaseLayout.astro`, `SiteMeta.astro`, `Footer.astro`, `ThemeSwitcher.astro`）。JSX 的に大文字始まりでインポート・利用する
- **ページ（`src/pages/`）はルートに直結するので小文字**、複数語のセグメントは kebab-case（`index.astro`, `404.astro`, 例: `about-me.astro` → `/about-me/`）
- **静的アセット（`public/`）は kebab-case**（`avatar.webp`, `og.png`, `style.css`）
- ディレクトリは小文字（`src/layouts/`, `src/components/`, `src/pages/`）
- アセット参照は **root-absolute パス**（`/style.css`, `/images/...`, `/favicon.ico`）。apex カスタムドメイン配信なのでサブパス考慮は不要
- 静的アセットは `public/` に置く（`public/images/`, `public/favicon.ico` 等）。ビルド時に `dist/` 直下へそのままコピーされる
- グローバル CSS は `public/style.css`（URL を `/style.css` で安定させるため Astro のバンドルには通さず、`BaseLayout` から `<link>` で読む）

## Internationalization (i18n)

日本語⇄英語は **言語別ページ + hreflang** で提供する（i18n ライブラリは使わない）。

- 言語ごとに独立したページ: `src/pages/index.astro`（日本語・正準 / x-default → `/`）と `src/pages/en/index.astro`（英語 → `/en/`）
- 共通の `<head>` は `src/layouts/BaseLayout.astro`、OGP / hreflang / canonical / JSON-LD は `src/components/SiteMeta.astro`（`lang` prop から URL・ロケールを導出）に集約。hreflang（`ja` / `en` / `x-default`）と `og:locale` を相互に張り、各ページの `canonical` は自分自身
- アセット参照は root-absolute（`/style.css`, `/images/...`）なので ja / en で分岐しない
- 初回訪問の自動言語判定は `index.astro` の `<script is:inline>` でのみ行う（`localStorage.lang` 未設定 かつ `navigator.language` が英語なら `/en/` へ `location.replace`）。`/en/` 側では判定しない（リダイレクトループ防止）。言語スイッチャー（`Footer.astro`）のクリックで `localStorage.lang` を保存し、以降の自動判定を抑止する
- テーマの FOUC 防止スクリプトと言語判定スクリプトは **`is:inline` 必須**（Astro のバンドル/defer を抑止し、本文描画前の同期実行を保つ）。テーマ/言語スイッチャーの挙動スクリプトは defer で問題ないので通常の `<script>`
- **`404.astro` は日英併記**。Workers の `not_found_handling: "404-page"` は最寄りの `404.html` を探すため、将来 `/en/404.astro` を置いて言語別 404 に分けることも可能
- `public/sitemap.xml` は手書きで全言語 URL を列挙し、各 `<url>` に `xhtml:link rel="alternate" hreflang` を付ける（ページ数が増えたら `@astrojs/sitemap` の導入を検討）
- 新しい言語別ページを追加したら、`tests/visual.spec.js` に対応する VRT を足す（ベースラインは CI で生成）

## OGP Image

`public/images/og.png`（1200×630, 8-bit sRGB）は手書きせず、テンプレートから生成する。

- テンプレート: `tools/og/template.html`（色・フォントは `public/style.css` と揃える）
- 生成: `pnpm og:generate`（Playwright chromium で 1200×630 をスクリーンショット → `public/images/og.png`）
- 文言やデザインを変えたらテンプレートを編集 → 再生成してコミットする
- 生成はローカル (macOS) で行う前提（フォントはシステムの Hiragino Sans に依存）。OGP 画像はページ描画に出ないため VRT ベースラインには影響しない

## Visual Regression Testing

PR ごとに描画スクリーンショットを取得し、PR コメントにインライン表示する仕組みを `.github/workflows/visual-regression.yml` で運用。

### 構成

- **Playwright** で chromium / desktop + mobile viewport × light / dark をキャプチャ
- ベースライン PNG は `tests/visual.spec.js-snapshots/` にコミット
- CI は PR 開く / 更新ごとに走り、結果を **orphan branch `visual-results`** の `pr-N/run-M/` に push
- PR コメント（sticky）に `raw.githubusercontent.com` 経由の URL で画像を埋め込み
- `visual` ジョブは **全 PR で起動**（`paths` フィルタ無し）。描画に関係するパス（`src/`, `public/`, `*.astro`, `astro.config.*`, `tests/`, playwright 設定, lockfile 等）に変更が無ければ Playwright を回さず success で終える。これにより `visual` を **必須ステータスチェック**にしても対象外 PR が *skipped* で詰まらない
- `main` のブランチ保護で `visual` を required status check に設定済み。**VRT が赤の PR は auto-merge できない**（意図的なビジュアル変更は後述の手順でベースラインを緑にしてからマージする）

### ローカル実行

```bash
pnpm install                 # 初回のみ
pnpm exec playwright install # ブラウザ取得（初回のみ）
pnpm test:visual             # Astro ビルド → dist/ 配信 → スナップショット比較
```

Playwright の `webServer` が `pnpm build && python3 -m http.server ... --directory dist` を自動起動するので、別途サーバーを立てる必要はない（本番 Workers と同じ `dist/` を撮影する）。

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
