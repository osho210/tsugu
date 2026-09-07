/** @type {import('dependency-cruiser').IConfiguration} */

const testPath =
  '(^|/)(?:test|tests|__tests__)(?:/|$)|(?:^|/)[^/]*(?:[.-](?:spec|test))\\.(?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$';

module.exports = {
  forbidden: [
    {
      name: 'WebからAPIへの直接依存を禁止',
      severity: 'error',
      comment:
        '依存方向違反です。apps/web から apps/api を直接 import してはいけません。共有したい型・契約・ドメイン概念は packages/* に切り出してください。',
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
      comment:
        '依存方向違反です。apps/api から apps/web を直接 import してはいけません。共有したい型・契約・ドメイン概念は packages/* に切り出してください。',
      from: {
        path: '^apps/api(?:/|$)',
      },
      to: {
        path: '^apps/web(?:/|$)',
      },
    },

    {
      name: '共有PackageからApplicationへの依存を禁止',
      severity: 'error',
      comment:
        '依存方向違反です。packages/* から apps/* を import してはいけません。共有PackageはWeb/APIより内側の独立した境界として維持してください。',
      from: {
        path: '^packages(?:/|$)',
      },
      to: {
        path: '^apps(?:/|$)',
      },
    },

    {
      name: 'Domainから外側レイヤーへの依存を禁止',
      severity: 'error',
      comment:
        '依存方向違反です。Domain層はApplication / Presentation / Infrastructure / Prismaなどの実装詳細へ依存してはいけません。',
      from: {
        path: '^apps/api/src/domain(?:/|$)',
      },
      to: {
        path: [
          '^apps/api/src/(?:application|presentation|infrastructure|prisma)(?:/|$)',
          '^apps/api/src/app\\.(?:controller|service|module)\\.ts$',
        ],
      },
    },

    {
      name: 'Applicationから外側レイヤーへの依存を禁止',
      severity: 'error',
      comment:
        '依存方向違反です。Application層はPresentation / Infrastructure / Prismaの実装へ直接依存してはいけません。interfaceを介して依存方向を反転してください。',
      from: {
        path: '^apps/api/src/application(?:/|$)',
      },
      to: {
        path: [
          '^apps/api/src/(?:presentation|infrastructure|prisma)(?:/|$)',
          '^apps/api/src/app\\.(?:controller|module)\\.ts$',
        ],
      },
    },

    {
      name: '循環依存を禁止',
      severity: 'error',
      comment:
        '循環依存が発生しています。責務の分割や依存方向を見直してください。',
      from: {},
      to: {
        circular: true,
      },
    },

    {
      name: '解決できない依存を禁止',
      severity: 'error',
      comment:
        'import先を解決できません。パス、依存パッケージ、モジュール設定を確認してください。',
      from: {},
      to: {
        couldNotResolve: true,
      },
    },

    {
      name: '本番コードからテストコードへの依存を禁止',
      severity: 'error',
      comment:
        '本番コードからtest/specファイルやtestディレクトリ配下をimportしてはいけません。共有処理は本番側の専用モジュールへ切り出してください。',
      from: {
        pathNot: testPath,
      },
      to: {
        path: testPath,
      },
    },

    {
      name: 'Infrastructure以外からPrismaへの直接依存を禁止',
      severity: 'error',
      comment:
        'DBアクセス境界違反です。Controller / Presentation / Application / Domain などからPrismaへ直接依存してはいけません。DBアクセスはInfrastructure側のRepository実装を介してください。',
      from: {
        path: '^apps/api/src(?:/|$)',
        pathNot: [
          '^apps/api/src/infrastructure(?:/|$)',
          '^apps/api/src/prisma(?:/|$)',
        ],
      },
      to: {
        path: [
          '^apps/api/src/prisma(?:/|$)',
          '^node_modules/@prisma/(?:orm-postgres|client)(?:/|$)',
        ],
      },
    },
  ],

  options: {
    doNotFollow: {
      path: ['node_modules'],
    },

    tsConfig: {
      fileName: 'apps/api/tsconfig.json',
    },

    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },

    skipAnalysisNotInRules: true,
  },
};