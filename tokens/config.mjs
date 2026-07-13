// Style Dictionary v4 設定。tokens.json（DTCG）から CSS custom properties を生成する。
// リポジトリルートから `pnpm tokens:build` で実行する前提のパス。
// 変数名は docs/design-system.md §03 に合わせ、color グループのみプレフィックスを外す（--ink, --signature, --spectral-1）。
export default {
  source: ['tokens/tokens.json'],
  hooks: {
    transforms: {
      'name/kajitack': {
        type: 'name',
        transform: (token) =>
          token.path[0] === 'color'
            ? token.path.slice(1).join('-')
            : token.path.join('-'),
      },
    },
  },
  platforms: {
    css: {
      transformGroup: 'css',
      transforms: ['name/kajitack'],
      buildPath: 'tokens/build/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
};
