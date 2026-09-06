/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [{
      name: 'WebからAPIへの直接依存を禁止',
      severity: 'error',
      comment: '依存方向違反です。apps/web から apps/api を直接 import してはいけません。Web と API は独立したアプリケーションとして扱い、共有したい型・契約・ドメイン概念は packages/* に切り出してください。',
      from: {
        path: '^apps/web(?:/|$)',
      },
      to: {
        path: '^apps/api(?:/|$)',
      },
    },

    {
      name: 'APIからWebへの直接依存を禁止',
      severity: 'error',
      comment: '依存方向違反です。apps/api から apps/web を直接 import してはいけません。Web と API は独立したアプリケーションとして扱い、共有したい型・契約・ドメイン概念は packages/* に切り出してください。',
      from: {
        path: '^apps/api(?:/|$)',
      },
      to: {
        path: '^apps/web(?:/|$)',
      },
    },

    {
      name: 'Domainから外側レイヤーへの依存を禁止',
      severity: 'error',
      comment: '依存方向違反です。Domain 層は Application / Presentation / Infrastructure 層に依存してはいけません。Domain は外側の実装詳細から独立させてください。',
      from: {
        path: '^apps/api/src/domain(?:/|$)',
      },
      to: {
        path: '^apps/api/src/(application|presentation|infrastructure)(?:/|$)',
      },
    },

    {
      name: 'Applicationから外側レイヤーへの依存を禁止',
      severity: 'error',
      comment: '依存方向違反です。Application 層は Presentation や Infrastructure の実装に直接依存してはいけません。外部処理が必要な場合は、Domain 側で定義した interface を介して依存方向を反転してください。',
      from: {
        path: '^apps/api/src/application(?:/|$)',
      },
      to: {
        path: '^apps/api/src/(presentation|infrastructure)(?:/|$)',
      },
    },

    {
      name: '循環依存を禁止',
      severity: 'error',
      comment: '循環依存が発生しています。モジュール同士が相互に依存しないよう、責務の分割や依存方向の見直しを行ってください。',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: '解決できない依存を禁止',
      severity: 'error',
      comment: 'import 先を解決できません。パスの誤り、依存パッケージの不足、またはモジュール設定を確認してください。',
      from: {},
      to: {
        couldNotResolve: true,
      },
    },

    {
      name: '本番コードからテストコードへの依存を禁止',
      severity: 'error',
      comment: '本番コードから spec / test ファイルを import してはいけません。共有したい処理がある場合は、テストファイルではなく専用のモジュールへ切り出してください。',
      from: {},
      to: {
        path: '[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$',
      },
    },
  ],

  options: {
    doNotFollow: {
      path: ['node_modules'],
    },

    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },

    skipAnalysisNotInRules: true,
  },
};