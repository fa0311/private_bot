import { GatewayIntentBits } from 'discord.js';
import * as env from '@/utils/env';
import Bot from '@/bot';
import { BotConfig } from '@/types/bot';

const allIntents = Object.entries(GatewayIntentBits)
  .map((e) => e[1])
  .flatMap((e) => (typeof e === 'string' ? [] : [e]));

const config: BotConfig = {
  line: {
    args: {
      channelAccessToken: env.getString('LINE_BOT.CHANNEL_ACCESS_TOKEN'),
      channelSecret: env.getString('LINE_BOT.CHANNEL_SECRET'),
    },
    port: env.getNumber('LINE_BOT.PORT', 3520),
    route: env.getString('LINE_BOT.ROUTE', '/webhook'),
  },
  linePush: {
    token: env.getString('LINE_PUSH.TOKEN'),
  },
  discord: {
    args: {
      intents: allIntents,
    },
    token: env.getString('DISCORD_BOT.TOKEN'),
  },
  discordPush: {
    token: env.getString('DISCORD_PUSH.TOKEN'),
  },
  webdav: {
    url: env.getString('WEBDAV.URL'),
    args: {
      username: env.getString('WEBDAV.USERNAME'),
      password: env.getString('WEBDAV.PASSWORD'),
    },
  },
  logger: {
    name: 'BOT',
    args: {
      appenders: {
        system: { type: 'file', filename: 'log/system.log' },
        console: { type: 'console' },
      },
      categories: {
        default: { appenders: ['system', 'console'], level: 'all' },
      },
    },
  },
};

new Bot(config).start();
