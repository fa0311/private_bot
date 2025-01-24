import type * as line from '@line/bot-sdk';
import type * as discord from 'discord.js';
import type * as log4js from 'log4js';

export type BotConfig = {
  line: {
    args: line.ClientConfig & line.MiddlewareConfig;
    port: number;
    route: string;
  };
  discord: {
    args: discord.ClientOptions;
    token: string;
  };
  logger: {
    name: string;
    args: log4js.Configuration;
  };
};

export type BotClient = {
  line: line.Client;
  discord: discord.Client;
  logger: log4js.Logger;
};
