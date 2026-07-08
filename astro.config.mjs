// @ts-check
import { defineConfig } from "astro/config";

// 素の HTML/CSS からの移行。配信物はゼロ JS の静的 HTML のまま。
// - site: canonical / OGP url / 将来の sitemap を絶対 URL で生成するため
// - trailingSlash + format:directory: 現行の `/` `/en/` という URL 形を維持
// - compressHTML:false: インライン要素間の空白を著者記述のまま保持し、
//   フッターの言語/テーマスイッチャーの描画を現行とピクセル一致させる
//   （VRT の据え置きベースラインを緑にするため）
export default defineConfig({
  site: "https://kajitack.com",
  trailingSlash: "always",
  compressHTML: false,
  build: {
    format: "directory",
  },
});
