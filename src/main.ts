import Bot from '@/bot';
import { hook } from '@/loader';
import { BotConfig } from '@/types/bot';
import * as env from '@/utils/env';
import { GatewayIntentBits } from 'discord.js';

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
  discord: {
    args: {
      intents: allIntents,
    },
    token: env.getString('DISCORD_BOT.TOKEN'),
  },
  logger: {
    name: 'BOT',
    args: {
      appenders: {
        system: { type: 'file', filename: env.getString('LOGGER.PATH') },
        console: { type: 'console' },
      },
      categories: {
        default: { appenders: ['system', 'console'], level: 'all' },
      },
    },
  },
};

new Bot(config, hook).start();
