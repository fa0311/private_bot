# private_bot

個人用のDiscord/LineBot

連携など細かい機能の盛り合わせ

セットアップはクソ大変

複数鯖はしてない(というか仕様上無謀)

```js
// クライアント
LINE_BOT.CHANNEL_ACCESS_TOKEN= // LINE Messaging API のアクセストークン
LINE_BOT.CHANNEL_SECRET= // Messaging API のシークレット
LINE_PUSH.TOKEN= // LINE Notify のトークン
DISCORD_BOT.TOKEN= // Discord API のトークン
DISCORD_PUSH.TOKEN= // Discord Webhook のトークン
WEBDAV.URL= // Webdav (Nextcloud) のURL
WEBDAV.USERNAME= // Webdav のユーザー名
WEBDAV.PASSWORD= // Webdav のパスワード

// モジュール
WEBDAV.SHARE_BASE_URL= // Nextcloud のURL
DISCORD_SET_PRESENCE.ACTIVITIES_NAME= // Discordのステータス
DISCORD_SET_PRESENCE.ACTIVITIES_URL=  // DiscordのステータスのURL
DISOCRD_SYNCHRONIZE_CHAT.CHANNNEL_ID= //  // Discord LINE同期のチャンネルID
```
