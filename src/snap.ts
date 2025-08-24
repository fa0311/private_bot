import { promises as fs } from 'fs';
import pino from 'pino';
import { getEnv } from './utils/env.js';
import { createLineClient } from './utils/line/line.js';
import { createLineNotifyClient } from './utils/line/webhook.js';
import { createTaskQueue } from './utils/queue.js';
import { createWebdavClient } from './utils/storage/storage.js';
import { createTwitterSnapClient } from './utils/twitter/twitter-snap.js';
import { exportPixivUrl, exportTwitterUrl } from './utils/twitter/utils.js';

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
  CHANNEL_ACCESS_TOKEN: env.text('LINE_BOT.CHANNEL_ACCESS_TOKEN'),
  CHANNEL_SECRET: env.text('LINE_BOT.CHANNEL_SECRET'),
  PORT: env.number('LINE_BOT.PORT', 8080),
  ROUTE: env.text('LINE_BOT.ROUTE', '/webhook'),
};

const LINE_PUSH = {
  TOKEN: env.text('LINE_PUSH.TOKEN'),
  BASE_URL: env.text('LINE_PUSH.BASE_URL', 'https://notify-api.line.me/api/notify'),
};

const WEBDAV = {
  URL: env.text('WEBDAV.URL'),
  USERNAME: env.text('WEBDAV.USERNAME'),
  PASSWORD: env.text('WEBDAV.PASSWORD'),
  BASE_PATH: env.text('WEBDAV.BASE_PATH', ''),
  SHARE_BASE_URL: env.text('WEBDAV.SHARE_BASE_URL'),
};

const TWITTER = {
  COOKIE_FILE: env.text('TWITTER.COOKIE_FILE', 'cookie.json'),
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
  ffmpegAdditonalOption: env.textOr('TWITTER.FFMPEG_ADDITIONAL_OPTION'),
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
