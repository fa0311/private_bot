import { promises as fs } from 'fs';
import pino from 'pino';
import { getEnv } from './utils/env.js';
import { createLineClient } from './utils/line/line.js';
import { createLineNotifyClient } from './utils/line/webhook.js';
import { createTaskQueue } from './utils/queue.js';
import { createWebdavClient } from './utils/storage/storage.js';
import { createTwitterSnapClient } from './utils/twitter/twitter-snap.js';
import { encodeCheck, exportPixivUrl, exportTwitterUrl } from './utils/twitter/utils.js';

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

const WEBDAV = {
  URL: env.text('WEBDAV_URL'),
  USERNAME: env.text('WEBDAV_USERNAME'),
  PASSWORD: env.text('WEBDAV_PASSWORD'),
  BASE_PATH: env.text('WEBDAV_BASE_PATH', ''),
  SHARE_BASE_URL: env.text('WEBDAV_SHARE_BASE_URL'),
};

const TWITTER = {
  COOKIE_FILE: env.text('TWITTER_COOKIE_FILE', 'cookie.json'),
  FFMPEG_ADDITONAL_OPTION: env.textOr('TWITTER_FFMPEG_ADDITIONAL_OPTION'),
};

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

const snap = await createTwitterSnapClient({
  cookiesFile: TWITTER.COOKIE_FILE,
  ffmpegAdditonalOption: TWITTER.FFMPEG_ADDITONAL_OPTION,
});
const linePush = createLineNotifyClient({
  token: LINE_PUSH.TOKEN,
  baseUrl: LINE_PUSH.BASE_URL,
});

const storage = createWebdavClient({
  url: WEBDAV.URL,
  username: WEBDAV.USERNAME,
  password: WEBDAV.PASSWORD,
  basePath: WEBDAV.BASE_PATH,
  baseShareUrl: WEBDAV.SHARE_BASE_URL,
});

const ignoreError = (error: unknown) => logger.error(error);

lineClient.client.on('error', (error) => {
  logger.error(error);
});

const processSnapQueue = createTaskQueue(1, (error) => {
  logger.error(error);
});

lineClient.client.on('text', async ({ body, event }) => {
  for (const id of exportTwitterUrl(event.text)) {
    const tempFile = 'temp/twitter';
    const userId = body.source.userId ?? 'unknown';

    processSnapQueue.add(async ({ index, getTotal }) => {
      const files = await snap.twitterSnap(tempFile, id);
      const res = await Promise.all(
        files.map(async (file) => {
          const dir = await storage.path(`snap/${userId}/${file}`);
          const data = await fs.readFile(`${tempFile}/${file}`);
          await dir.putFileContents(data);
          await fs.unlink(`${tempFile}/${file}`).catch(ignoreError);
          return dir.url;
        })
      );
      await linePush.sendMessage(`スナップしました[${index}/${getTotal()}]\n${res.join('\n')}`).catch(ignoreError);
    });
  }

  for (const id of exportPixivUrl(event.text)) {
    const tempFile = 'temp/pixiv';
    const userId = body.source.userId ?? 'unknown';

    processSnapQueue.add(async ({ index, getTotal }) => {
      const files = await snap.pixivSnap(tempFile, id);
      const res = await Promise.all(
        files.map(async (file) => {
          const dir = await storage.path(`snap/${userId}/pixiv/${file}`);
          const data = await fs.readFile(`${tempFile}/${file}`);
          await dir.putFileContents(data);
          await fs.unlink(`${tempFile}/${file}`).catch(ignoreError);
          return dir.url;
        })
      );
      await linePush.sendMessage(`スナップしました[${index}/${getTotal()}]\n${res.join('\n')}`).catch(ignoreError);
    });
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
