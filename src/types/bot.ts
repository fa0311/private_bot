import * as discord from "discord.js";
import * as line from "@line/bot-sdk";
import LinePushClient from "src/client/linePush";
import DiscordPushClient from "src/client/discordPush";
import * as webdav from "webdav";
import * as log4js from "log4js";
import MusicQueue from "src/music";

export type BotConfig = {
  line: {
    args: line.ClientConfig & line.MiddlewareConfig;
    port: number;
    route: string;
  };
  linePush: {
    token: string;
  };
  discord: {
    args: discord.ClientOptions;
    token: string;
  };
  discordPush: {
    token: string;
  };
  webdav: {
    url: string;
    args: webdav.WebDAVClientOptions;
  };
  logger: {
    name: string;
    args: log4js.Configuration;
  };
};

export type BotClient = {
  line: line.Client;
  linePush: LinePushClient;
  discord: discord.Client;
  discordPush: DiscordPushClient;
  webdav: webdav.WebDAVClient;
  logger: log4js.Logger;
  music: MusicQueue[];
};
