module.exports = {
    prompter(cz, commit) {
        cz.prompt([{
                type: 'list',
                name: 'impact',
                message: '変更影響を選択してください:',
                choices: [{
                        name: 'patch - バグ修正・小規模な変更',
                        value: 'patch',
                    },
                    {
                        name: 'minor - 後方互換性のある機能追加',
                        value: 'minor',
                    },
                    {
                        name: 'major - 破壊的変更・大規模な変更',
                        value: 'major',
                    },
                ],
            },
            {
                type: 'list',
                name: 'type',
                message: '変更種別を選択してください:',
                choices: [{
                        name: 'feat     - 機能追加',
                        value: 'feat'
                    },
                    {
                        name: 'fix      - バグ修正',
                        value: 'fix'
                    },
                    {
                        name: 'test     - テスト追加・修正',
                        value: 'test'
                    },
                    {
                        name: 'chore    - 開発環境・依存関係',
                        value: 'chore'
                    },
                    {
                        name: 'refactor - リファクタリング',
                        value: 'refactor'
                    },
                    {
                        name: 'docs     - ドキュメント',
                        value: 'docs'
                    },
                    {
                        name: 'ci       - CI/CD',
                        value: 'ci'
                    },
                    {
                        name: 'perf     - パフォーマンス改善',
                        value: 'perf'
                    },
                    {
                        name: 'revert   - 変更の取り消し',
                        value: 'revert'
                    },
                ],
            },
            {
                type: 'input',
                name: 'scope',
                message: '変更対象のscopeを入力してください（任意）:',
            },
            {
                type: 'input',
                name: 'subject',
                message: '変更内容を入力してください:',
                validate(value) {
                    return value.trim().length > 0 || '変更内容を入力してください';
                },
            },
        ]).then((answers) => {
            const scope = answers.scope.trim() ?
                `(${answers.scope.trim()})` :
                '';

            const message =
                `${answers.impact}-${answers.type}${scope}: ${answers.subject.trim()}`;

            commit(message);
        });
    },
};