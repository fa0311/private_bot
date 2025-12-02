import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import pino from "pino";
import { z } from "zod";
import { getEnv, zBoolean } from "./utils/env.js";
import { createLineClient } from "./utils/line/line.js";
import { createLineNotifyClient } from "./utils/line/webhook.js";
import { createWebdavClient } from "./utils/storage/storage.js";
import { createTwitterSnapClient, getExtByContentType } from "./utils/twitter/twitter-snap.js";
import { exportPixivUrl, exportTwitterUrl } from "./utils/twitter/utils.js";

const env = await getEnv(
  z.object({
    LOG_LEVEL: z.string().default("info"),
    BOT_SEND_READY_MESSAGE: zBoolean().default(false),

    LINE_BOT_CHANNEL_ACCESS_TOKEN: z.string(),
    LINE_BOT_CHANNEL_SECRET: z.string(),
    LINE_BOT_PORT: z.coerce.number().default(8080),
    LINE_BOT_ROUTE: z.string().default("/webhook"),
    LINE_PUSH_TOKEN: z.string(),
    LINE_PUSH_BASE_URL: z.string().default("https://notify-api.line.me/api/notify"),

    WEBDAV_URL: z.string(),
    WEBDAV_USERNAME: z.string(),
    WEBDAV_PASSWORD: z.string(),
    WEBDAV_BASE_PATH: z.string().default("/"),
    WEBDAV_SHARE_BASE_URL: z.string(),

    TWITTER_SNAP_API_BASEURL: z.string(),
  }),
);

const logger = pino({
  level: env.LOG_LEVEL,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

const lineClient = await createLineClient(
  {
    channelAccessToken: env.LINE_BOT_CHANNEL_ACCESS_TOKEN,
    channelSecret: env.LINE_BOT_CHANNEL_SECRET,
  },
  {
    port: env.LINE_BOT_PORT,
    route: env.LINE_BOT_ROUTE,
  },
);

const snap = await createTwitterSnapClient({
  baseurl: env.TWITTER_SNAP_API_BASEURL,
});
const linePush = createLineNotifyClient({
  token: env.LINE_PUSH_TOKEN,
  baseUrl: env.LINE_PUSH_BASE_URL,
});

const storage = createWebdavClient({
  url: env.WEBDAV_URL,
  username: env.WEBDAV_USERNAME,
  password: env.WEBDAV_PASSWORD,
  basePath: env.WEBDAV_BASE_PATH,
  baseShareUrl: env.WEBDAV_SHARE_BASE_URL,
});

const ignoreError = (error: unknown) => logger.error(error);
const errorHandler = async (callback: () => Promise<void>) => {
  await callback().catch(async (error) => {
    logger.error(error);
    await linePush.sendMessage(`Error: ${error}`).catch(ignoreError);
  });
};

if (env.BOT_SEND_READY_MESSAGE) {
  await linePush.sendMessage("Ready").catch(ignoreError);
}
logger.info("Ready");

lineClient.client.on("error", (error) => {
  logger.error(error);
});

const checkStorage = async (userId: string, id: string) => {
  const existsCheck = await Promise.all(
    ["png", "mp4"].map(async (ext) => {
      const path = storage.path(`snap/${userId}/${id}.${ext}`);
      const exists = await path.exists();
      return [path.url, exists] as const;
    }),
  );
  const exists = existsCheck.find(([_, exists]) => exists);
  return exists ? exists[0] : null;
};

lineClient.client.on("text", async ({ body, event }) => {
  logger.info(`Received message: ${event.text}`);
  for (const [_, __, id] of exportTwitterUrl(event.text)) {
    await errorHandler(async () => {
      const userId = body.source.userId ?? "unknown";
      const exists = await checkStorage(userId, id);
      if (exists) {
        await linePush.sendMessage(`既にスナップ済みです\n${exists}`).catch(ignoreError);
      } else {
        const res = await snap.twitter(id);
        const ext = getExtByContentType(res.contentType);
        const dir = storage.path(`snap/${userId}/${id}.${ext}`);
        const nodeReadable = Readable.fromWeb(res.body);
        const nodeWriteStream = await dir.createWriteStream({
          headers: {
            "Content-Type": res.contentType,
            "Content-Length": res.length,
          },
        });
        await pipeline(nodeReadable, nodeWriteStream);
        await linePush.sendMessage(`スナップしました\n${dir.url}`).catch(ignoreError);
      }
    });
  }

  for (const [_, id] of exportPixivUrl(event.text)) {
    await errorHandler(async () => {
      const userId = body.source.userId ?? "unknown";
      const exists = await checkStorage(userId, id);
      if (exists) {
        await linePush.sendMessage(`既にスナップ済みです\n${exists}`).catch(ignoreError);
      } else {
        const res = await snap.pixiv(id);
        const ext = getExtByContentType(res.contentType);
        const dir = storage.path(`snap/${userId}/pixiv/${id}.${ext}`);
        const nodeReadable = Readable.fromWeb(res.body);
        const nodeWriteStream = await dir.createWriteStream({
          headers: {
            "Content-Type": res.contentType,
            "Content-Length": res.length,
          },
        });
        await pipeline(nodeReadable, nodeWriteStream);
        await linePush.sendMessage(`スナップしました\n${dir.url}`).catch(ignoreError);
      }
    });
  }
});

// デバッグ用
lineClient.client.on("text", async ({ body, event }) => {
  const replyToken = body.replyToken;

  if (event.text === "/receive") {
    lineClient.client.once("all", async ({ body }) => {
      await lineClient.api
        .replyMessage({
          replyToken: replyToken,
          messages: [
            {
              type: "text",
              text: JSON.stringify(body, null, 2),
            },
          ],
        })
        .catch(ignoreError);
    });
  }
});
