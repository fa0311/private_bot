# Private Bot

次世代BOTプロジェクト - LINE BOT SDKとDiscord.jsを使用した統合ボットシステム

## 🚀 特徴

- **モダン技術スタック**: TypeScript + ESM + pnpm + Biome
- **マルチプラットフォーム対応**: LINE & Discord
- **Docker対応**: 本番環境での簡単デプロイ
- **CI/CD**: GitHub Actionsによる自動化
- **セキュリティ**: 脆弱性スキャン付き

## 📋 必要条件

- Node.js 20.0.0以上
- pnpm 8.0.0以上
- Docker（本番環境）

## 🛠 セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
# .envファイルを編集して必要な認証情報を設定
```

### 3. 開発サーバーの起動

```bash
pnpm dev
```

## 📦 使用可能なコマンド

```bash
# 開発サーバー起動
pnpm dev

# プロダクションビルド
pnpm build

# 本番実行
pnpm start

# テスト実行
pnpm test

# テスト（watch モード）
pnpm test:watch

# リント
pnpm lint

# リント修正
pnpm lint:fix

# フォーマット
pnpm format
```

## 🐳 Docker

### 開発環境

```bash
docker-compose up dev
```

### 本番環境

```bash
docker-compose up prod
```

## 🤖 BOT機能

### LINE Bot

- Webhook経由でのメッセージ受信
- エコーメッセージ機能

### Discord Bot

- メッセージ作成イベントの監視
- `!echo` コマンドでのエコー機能

## 🏗 プロジェクト構造

```
private_bot/
├── src/
│   ├── config.ts      # 設定管理
│   ├── line.ts        # LINE Bot実装
│   ├── discord.ts     # Discord Bot実装
│   └── index.ts       # エントリーポイント
├── tests/             # テストファイル
├── .github/           # GitHub Actions
├── Dockerfile         # Docker設定
├── docker-compose.yml # Docker Compose設定
└── ...設定ファイル
```

## 🔧 設定

### 必要な環境変数

```env
# LINE Bot
LINE_BOT.CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_BOT.CHANNEL_SECRET=your_line_channel_secret
LINE_BOT.PORT=3000

# Discord Bot
DISCORD_BOT.TOKEN=your_discord_bot_token

# Logger
LOGGER.PATH=log/system.log
```

## 🚀 デプロイ

GitHub Actionsが自動的に以下を実行します：

1. **テスト & リント**: コード品質チェック
2. **Docker イメージビルド**: マルチアーキテクチャ対応
3. **セキュリティスキャン**: Trivyによる脆弱性検査
4. **GitHub Container Registryへのプッシュ**

## 🧪 テスト

```bash
# 全テスト実行
pnpm test

# カバレッジ付きテスト
pnpm test --coverage
```

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
