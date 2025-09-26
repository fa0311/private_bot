import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Events, GatewayIntentBits } from 'discord.js';
import pino from 'pino';
import { createDiscordClient, getUrl } from './utils/discord/discord.js';
import { toQuoted, toSummary } from './utils/discord/utils.js';
import { createDiscordWebHookClient } from './utils/discord/webhook.js';
import { getEnv } from './utils/env.js';
import { createLineClient, getSourceId, lineQuotedMessageManager } from './utils/line/line.js';
import { getSticker } from './utils/line/sticker.js';
import { createLineNotifyClient } from './utils/line/webhook.js';
import { createWebdavClient, dateFormat, streamToBuffer } from './utils/storage/storage.js';
import { tweetNormalize } from './utils/twitter.js';
import { createTwitterClient } from './utils/twitter/twitter.js';
import { encodeCheck } from './utils/twitter/utils.js';

const env = getEnv();

const logger = pino({
  level: env.text('LOG_LEVEL', 'info'),
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

const BOT = {
  SEND_READY_MESSAGE: env.boolean('BOT_SEND_READY_MESSAGE', true),
};

const DISCORD_BOT = {
  TOKEN: env.text('DISCORD_BOT_TOKEN'),
};

const DISCORD_PUSH = {
  TOKEN: env.text('DISCORD_PUSH_TOKEN'),
  BASE_URL: env.text('DISCORD_PUSH_BASE_URL', 'https://discordapp.com/api/webhooks'),
};

const LINE_BOT = {
  CHANNEL_ACCESS_TOKEN: env.text('LINE_BOT_CHANNEL_ACCESS_TOKEN'),
  CHANNEL_SECRET: env.text('LINE_BOT_CHANNEL_SECRET'),
  PORT: env.number('LINE_BOT_PORT', 8080),
  ROUTE: env.text('LINE_BOT_ROUTE', '/webhook'),
};

const LINE_PUSH = {
  TOKEN: env.text('LINE_PUSH_TOKEN'),
  BASE_URL: env.text('LINE_PUSH_BASE_URL', 'https://notify-api.line.me/api/notify'),
};

const LINE_SYNCHRONIZE_CHAT = {
  CHANNEL_ID: env.text('LINE_SYNCHRONIZE_CHAT_CHANNEL_ID'),
};

const DISCORD_SYNCHRONIZE_CHAT = {
  CHANNEL_ID: env.textOr('DISCORD_SYNCHRONIZE_CHAT_CHANNEL_ID'),
  GUILD_ID: env.textOr('DISCORD_SYNCHRONIZE_CHAT_GUILD_ID'),
};

const DISCORD_SYNCHRONIZE_VOICE = {
  CHANNEL_ID: env.textOr('DISCORD_SYNCHRONIZE_VOICE_CHANNEL_ID'),
  GUILD_ID: env.textOr('DISCORD_SYNCHRONIZE_VOICE_GUILD_ID'),
};

const DISCORD_SET_PRESENCE = {
  ACTIVITIES_NAME: env.text('DISCORD_SET_PRESENCE_ACTIVITIES_NAME'),
  ACTIVITIES_URL: env.text('DISCORD_SET_PRESENCE_ACTIVITIES_URL'),
};

const WEBDAV = {
  URL: env.text('WEBDAV_URL'),
  USERNAME: env.text('WEBDAV_USERNAME'),
  PASSWORD: env.text('WEBDAV_PASSWORD'),
  BASE_PATH: env.text('WEBDAV_BASE_PATH', ''),
  SHARE_BASE_URL: env.text('WEBDAV_SHARE_BASE_URL'),
};

const TWITTER = {
  COOKIE_FILE: env.text('TWITTER_COOKIE_FILE', 'cookie.json'),
};

const discordClient = await createDiscordClient(
  {
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
  },
  DISCORD_BOT.TOKEN
);

const lineClient = await createLineClient(
  {
    channelAccessToken: LINE_BOT.CHANNEL_ACCESS_TOKEN,
    channelSecret: LINE_BOT.CHANNEL_SECRET,
  },
  {
    port: LINE_BOT.PORT,
    route: LINE_BOT.ROUTE,
  }
);
const linePush = createLineNotifyClient({
  token: LINE_PUSH.TOKEN,
  baseUrl: LINE_PUSH.BASE_URL,
});

const discordPush = createDiscordWebHookClient({
  token: DISCORD_PUSH.TOKEN,
  baseUrl: DISCORD_PUSH.BASE_URL,
});

const storage = createWebdavClient({
  url: WEBDAV.URL,
  username: WEBDAV.USERNAME,
  password: WEBDAV.PASSWORD,
  basePath: WEBDAV.BASE_PATH,
  baseShareUrl: WEBDAV.SHARE_BASE_URL,
});

const twitterClient = await createTwitterClient(TWITTER.COOKIE_FILE);

const ignoreError = (error: unknown) => logger.error(error);
const ignoreCallback = async (callback: () => Promise<unknown>) => {
  await callback().catch(ignoreError);
};

const pushMessage = async (text: string) => {
  await linePush.sendMessage(text).catch(ignoreError);
  await discordPush.send({ content: text }).catch(ignoreError);
};

if (BOT.SEND_READY_MESSAGE) {
  await linePush.sendMessage('Ready').catch(ignoreError);
  await discordPush.send({ content: 'Ready' }).catch(ignoreError);
}
logger.info('Ready');

lineClient.client.on('error', (error) => {
  logger.error(error);
});
discordClient.client.on('error', (error) => {
  logger.error(error);
});

discordClient.client.user?.setPresence({
  status: 'online',
  activities: [
    {
      name: DISCORD_SET_PRESENCE.ACTIVITIES_NAME,
      url: DISCORD_SET_PRESENCE.ACTIVITIES_URL,
    },
  ],
});
const lineMesageCache = lineQuotedMessageManager<{ name: string; message: string }>();

// LINEに来たメッセージをDiscordに転送
lineClient.client.on('text', async ({ body, event }) => {
  logger.info(`Received message: ${event.text}`);
  if (getSourceId(body) !== LINE_SYNCHRONIZE_CHAT.CHANNEL_ID) return;
  const profile = await lineClient.getProfile(body.source);
  lineMesageCache.set(event, { name: profile.displayName, message: event.text });
  const quotedText = lineMesageCache.get(event);
  if (quotedText === undefined) {
    await discordPush
      .send({ content: event.text, username: profile.displayName, avatar_url: profile.pictureUrl })
      .catch(ignoreError);
  } else {
    const text = `${toQuoted(quotedText.data?.message ?? '不明なメッセージ')}\n${event.text}`;
    await discordPush
      .send({ content: text, username: profile.displayName, avatar_url: profile.pictureUrl })
      .catch(ignoreError);
  }
});

// LINEに来たスタンプをDiscordに転送
lineClient.client.on('sticker', async ({ body, event }) => {
  if (getSourceId(body) !== LINE_SYNCHRONIZE_CHAT.CHANNEL_ID) return;
  const { stickerId } = event;
  const dir = await storage.path(`sticker/${stickerId}.png`);
  if (!(await dir.exists())) {
    const buffer = await getSticker(stickerId);
    await dir.putFileContents(buffer).catch(ignoreError);
  }

  const profile = await lineClient.getProfile(body.source);
  const message = event.text === undefined ? dir.url : `[${event.text}]\n${dir.url}`;
  lineMesageCache.set(event, { name: profile.displayName, message });
  const quotedText = lineMesageCache.get(event);
  if (quotedText === undefined) {
    await discordPush
      .send({ content: message, username: profile.displayName, avatar_url: profile.pictureUrl })
      .catch(ignoreError);
  } else {
    const text = `${toQuoted(quotedText.data?.message ?? '不明なメッセージ')}\n${message}`;
    await discordPush
      .send({ content: text, username: profile.displayName, avatar_url: profile.pictureUrl })
      .catch(ignoreError);
  }
});

// LINEに来たコンテンツをDiscordに転送
lineClient.client.on('hasContents', async ({ body, event }) => {
  if (getSourceId(body) !== LINE_SYNCHRONIZE_CHAT.CHANNEL_ID) return;
  const extension = (() => {
    switch (event.type) {
      case 'image':
        return 'jpg';
      case 'audio':
        return 'mp3';
      case 'video':
        return 'mp4';
      case 'file':
        return event.fileName.split('.').slice(-1)[0];
    }
  })();
  const dir = await storage.path(`${dateFormat('YYYY-MM')}/${event.id}.${extension}`);
  const readableStream = await lineClient.blob.getMessageContent(event.id);
  await dir.putFileContents(await streamToBuffer(readableStream)).catch(ignoreError);
  const profile = await lineClient.getProfile(body.source);
  await discordPush
    .send({
      content: dir.url,
      username: profile.displayName,
      avatar_url: profile.pictureUrl,
    })
    .catch(ignoreError);
});

// Discordから来たメッセージをLINEに転送
discordClient.client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (DISCORD_SYNCHRONIZE_CHAT.GUILD_ID && DISCORD_SYNCHRONIZE_CHAT.GUILD_ID !== message.guildId) return;
  if (DISCORD_SYNCHRONIZE_CHAT.CHANNEL_ID && DISCORD_SYNCHRONIZE_CHAT.CHANNEL_ID !== message.channelId) return;
  const getExtension = (e: string) => {
    const s = e.split('.');
    if (s.length === 1) return '';
    return `.${s.slice(-1)[0]}`;
  };

  if (message.content !== '') {
    const username = message.author.username;
    const messageId = message.reference?.messageId;
    if (messageId !== undefined) {
      const ref = await message.channel.messages.fetch(messageId);
      const text = `${toSummary(`${ref.author.username}>>${ref.content}`)}\n[返信]${username}>>${message.content}`;
      await linePush.sendMessage(text).catch(ignoreError);
    } else {
      await linePush.sendMessage(`${username}>>${message.content}`).catch(ignoreError);
    }
  }

  const res = message.attachments.map(async (e) => {
    const username = message.author.username;
    const results = await getUrl(e.proxyURL);
    const ext = getExtension(e.name);
    const dir = await storage.path(`${dateFormat('YYYY-MM')}/${e.id}${ext}`);

    if (['.jpeg', '.png', '.jpg'].includes(ext)) {
      if ('send' in message.channel && typeof message.channel.send === 'function') {
        const button1 = new ButtonBuilder()
          .setCustomId(`resend:${message.id}`)
          .setEmoji('🔁')
          .setLabel('再送信')
          .setStyle(ButtonStyle.Primary);

        const button2 = new ButtonBuilder()
          .setCustomId(`url:${message.id}`)
          .setEmoji('🔗')
          .setLabel('URLとして送信')
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(button1, button2);

        const msg = await message.reply({
          content: `送信が失敗している場合は、以下のボタンで再送信またはURL送信が可能です。`,
          components: [row.toJSON()],
        });
        const controller = msg.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60 * 1000,
        });
        controller.on('collect', async (i) => {
          if (i.customId === `resend:${message.id}`) {
            await ignoreCallback(async () => {
              await linePush.sendFile({
                name: dir.name,
                image: new Blob([results]),
                message: message.content,
                user: username,
              });
              await i.reply({ content: '再送信しました。', ephemeral: true });
            });
          } else if (i.customId === `url:${message.id}`) {
            await ignoreCallback(async () => {
              await linePush.sendMessage(dir.url);
              await i.reply({ content: 'URLを送信しました。', ephemeral: true });
            });
          }
        });
        controller.on('end', async () => {
          await msg.delete().catch(ignoreError);
        });
        controller.on('error', async (error) => {
          logger.error(error);
        });

        await dir.putFileContents(Buffer.from(results)).catch(ignoreError);
        await linePush
          .sendFile({
            name: dir.name,
            image: new Blob([results]),
            message: message.content,
            user: username,
          })
          .catch(ignoreError);
      }
    } else {
      await dir.putFileContents(Buffer.from(results)).catch(ignoreError);
      await linePush.sendMessage(dir.url).catch(ignoreError);
    }
  });

  await Promise.all(res);
});

// Discordのボイスチャットの状態変化をLINEに転送
discordClient.client.on(Events.VoiceStateUpdate, async (before, after) => {
  const member = before.member ?? after.member;
  const channel = before.channel ?? after.channel;
  const guild = before.guild ?? after.guild;
  if (!member || !channel || !guild) return;
  if (member.user.bot) return;
  if (DISCORD_SYNCHRONIZE_VOICE.GUILD_ID && DISCORD_SYNCHRONIZE_VOICE.GUILD_ID === guild.id) return;
  if (DISCORD_SYNCHRONIZE_VOICE.CHANNEL_ID && DISCORD_SYNCHRONIZE_VOICE.CHANNEL_ID === channel.id) return;
  if (after.channelId === before.channelId) return;
  const members = channel.members.filter((e) => !e.user.bot);

  if (before.channel && after.channel) {
    const text = `${member.user.tag}が${before.channel.name}から${after.channel.name}に移動しました`;
    await pushMessage(text).catch(ignoreError);
  } else if (before.channel) {
    const text = `${member.user.tag}が${before.channel.name}から退出しました`;
    if (members.size === 0) {
      await pushMessage(`[通話が終了しました]\n${text}`).catch(ignoreError);
    } else {
      await pushMessage(text).catch(ignoreError);
    }
  } else if (after.channel) {
    const text = `${member.user.tag}が${after.channel.name}に参加しました`;
    if (members.size === 1) {
      await pushMessage(`[通話が開始しました]\n${text}`).catch(ignoreError);
    } else {
      await pushMessage(text).catch(ignoreError);
    }
  }
});

// LINEに来たツイートの詳細を表示する
lineClient.client.on('text', async ({ body, event }) => {
  if (getSourceId(body) !== LINE_SYNCHRONIZE_CHAT.CHANNEL_ID) return;
  const responses = await twitterClient.fromText(event.text);
  const text: string[] = [];

  for (const [id, response] of responses) {
    if (response.data.data.length > 0) {
      const index = response.data.data.findIndex((e) => e.tweet.restId === id[2]);
      for (const tweet of response.data.data.slice(0, index)) {
        text.push(tweet.user.legacy.name);
        text.push(tweetNormalize(tweet.tweet));
        text.push('----------');
      }
      const tweet = response.data.data[index];
      if (tweet !== undefined) {
        if (tweet.quoted) {
          text.push(tweet.quoted.user.legacy.name);
          text.push(tweetNormalize(tweet.quoted.tweet));
          text.push('----------');
        }
        text.push(tweet.user.legacy.name);
        text.push(tweetNormalize(tweet.tweet));
      }
    }
  }

  if (text.length > 0) {
    await lineClient.api
      .replyMessage({
        replyToken: body.replyToken,
        messages: [
          {
            type: 'text',
            text: text.join('\n'),
          },
        ],
      })
      .catch(ignoreError);
  }
});

// デバッグ用
lineClient.client.on('text', async ({ body, event }) => {
  const replyToken = body.replyToken;

  if (event.text === '/receive') {
    lineClient.client.once('all', async ({ body }) => {
      await lineClient.api
        .replyMessage({
          replyToken: replyToken,
          messages: [
            {
              type: 'text',
              text: JSON.stringify(body, null, 2),
            },
          ],
        })
        .catch(ignoreError);
    });
  }

  if (event.text === '/status') {
    const codes = {
      nvenc: [['h264_nvenc', 'mp4'] as const, ['hevc_nvenc', 'mp4'] as const, ['av1_nvenc', 'webm'] as const],
      qsv: [
        ['h264_qsv', 'mp4'] as const,
        ['hevc_qsv', 'mp4'] as const,
        ['av1_qsv', 'webm'] as const,
        ['vp9_qsv', 'webm'] as const,
      ],
      vaapi: [
        ['h264_vaapi', 'mp4'] as const,
        ['hevc_vaapi', 'mp4'] as const,
        ['av1_vaapi', 'webm'] as const,
        ['vp8_vaapi', 'webm'] as const,
        ['vp9_vaapi', 'webm'] as const,
      ],
      vulkan: [['h264_vulkan', 'mp4'] as const, ['hevc_vulkan', 'mp4'] as const, ['av1_vulkan', 'webm'] as const],
    };
    const text = await Promise.all(
      Object.entries(codes).map(async ([key, values]) => {
        const res = await Promise.all(
          values.map(async ([codec, format]) => {
            const ok = await encodeCheck({ format, codec });
            return `${ok ? '✅' : '❌'}${codec}`;
          })
        );
        return [`=== ${key} ===`, ...res].join('\n');
      })
    );

    await lineClient.api
      .replyMessage({
        replyToken: replyToken,
        messages: [
          {
            type: 'text',
            text: text.join('\n\n'),
          },
        ],
      })
      .catch(ignoreError);
  }
});
