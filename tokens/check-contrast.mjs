// tokens.json の色ペアが WCAG 2.1 のコントラスト基準を満たすか検証する。
// 失敗があれば exit 1（生成パイプラインと同様、CI / pre-commit で回す前提）。
// 基準: テキスト AA = 4.5 / 大きいテキスト・UI 部品・グラフィック (1.4.11) = 3.0
import { readFileSync } from 'node:fs';

const tokens = JSON.parse(readFileSync(new URL('./tokens.json', import.meta.url)));

const hex = (path) => path.split('.').reduce((o, k) => o[k], tokens).$value;

const luminance = (h) => {
  const clean = h.replace('#', '');
  const full = clean.length === 3 ? [...clean].map((c) => c + c).join('') : clean;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (fg, bg) => {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
};

// [前景, 背景, 要求比, 用途]
const PAIRS = [
  ['color.paper', 'color.ink', 4.5, '本文テキスト'],
  ['color.paper', 'color.carbon', 4.5, '本文テキスト（カード上）'],
  ['color.paper', 'color.panel', 4.5, '本文テキスト（部品タイル上）'],
  ['color.muted', 'color.ink', 4.5, '二次テキスト'],
  ['color.muted', 'color.carbon', 4.5, '二次テキスト（カード上）'],
  ['color.muted', 'color.panel', 4.5, '二次テキスト（部品タイル上）'],
  ['color.faint', 'color.ink', 4.5, 'システムラベル（11-12px）。テキストは --ink 地専用'],
  ['color.faint', 'color.carbon', 3.0, 'faint を carbon 上で非テキスト装飾に使う場合（テキストは muted）'],
  ['color.signature', 'color.ink', 4.5, 'signature をテキスト・一語で使う場合'],
  ['color.signature', 'color.carbon', 4.5, 'signature テキスト（カード上）'],
  ['color.ink', 'color.signature', 4.5, 'AccentCTA（橙地に黒文字）'],
  ['color.signature', 'color.ink', 3.0, 'signature を UI 部品・フォーカスリングで使う場合'],
  ...Array.from({ length: 7 }, (_, i) => [
    `color.spectral.${i + 1}`, 'color.ink', 3.0, `SpectralBar 帯 ${i + 1}（グラフィック 1.4.11）`,
  ]),
];

let failed = 0;
for (const [fg, bg, need, usage] of PAIRS) {
  const r = ratio(hex(fg), hex(bg));
  const ok = r >= need;
  if (!ok) failed++;
  console.log(
    `${ok ? '✓' : '✗'} ${r.toFixed(2).padStart(6)} (要求 ${need}) ${fg.replace('color.', '--')} on ${bg.replace('color.', '--')} — ${usage}`,
  );
}

if (failed) {
  console.error(`\n${failed} 件が WCAG 基準を満たしていない`);
  process.exit(1);
}
console.log('\n全ペアが WCAG 2.1 AA を満たす');
