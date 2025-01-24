import Archivebox from '@/utils/archivebox';

import DiscordPushClient from '@/client/discordPush';
import * as webdav from 'webdav';

import LinePushClient from '@/client/linePush';
import { serPresence } from '@/modules/discordSetPresence';
import { discordVoicePush } from '@/modules/discordVoicePush';
import { dumpEvent } from '@/modules/dumpEvent';
import { discordReady, lineReady } from '@/modules/ready';
import { discordSynchronize, lineSynchronizeFile, lineSynchronizeText } from '@/modules/synchronizeChat';
import { twitterSnap, twitterViewer } from '@/modules/twitter';
import { allWebArchive, webArchive } from '@/modules/webArchive';
import type { HookFn, HookType } from '@/types/modules';
import * as env from '@/utils/env';
import { makedirs } from '@/utils/webdav';
import dayjs from 'dayjs';
import { TwitterOpenApi } from 'twitter-openapi-typescript';

import { promises as fs } from 'node:fs';

export type Cookie = {
  name: string;
  domain: string;
  value: string;
};

const archivebox = new Archivebox('https://xn--l8jeu7orz.xn--w8j2f.com/add/');

const nextcloud = webdav.createClient(env.getString('WEBDAV.URL'), {
  username: env.getString('WEBDAV.USERNAME'),
  password: env.getString('WEBDAV.PASSWORD'),
  maxBodyLength: Number.POSITIVE_INFINITY,
  maxContentLength: Number.POSITIVE_INFINITY,
});

const putFileContents = async (path: string, contents: Uint8Array): Promise<void> => {
  try {
    await nextcloud.putFileContents(path, contents);
  } catch (e) {
    console.error(e);
  }
};

const putFile = async (name: string, contents: Uint8Array): Promise<string> => {
  const time = dayjs(new Date()).locale('ja').format('YYYY-MM');
  const path = `LINE/${time}/${name}`;
  await makedirs(nextcloud, `LINE/${time}`);
  await putFileContents(path, contents).catch((e) => console.error(e));
  return `${env.getString('WEBDAV.SHARE_BASE_URL')}${path} `;
};

const putSnap = async (id: string, dir: string, name: string): Promise<string> => {
  await makedirs(nextcloud, `LINE/snap/${id}`);
  await putFileContents(`LINE/snap/${id}/${name}`, await fs.readFile(`${dir}/${name}`));
  return `${env.getString('WEBDAV.SHARE_BASE_URL')}LINE/snap/${id}/${name}`;
};

const discordPush = new DiscordPushClient(env.getString('DISCORD_PUSH.TOKEN'), putFile);
const linePush = new LinePushClient(env.getString('LINE_PUSH.TOKEN'), putFile);

const discordPresence = {
  name: env.getString('DISCORD_SET_PRESENCE.ACTIVITIES_NAME'),
  url: env.getString('DISCORD_SET_PRESENCE.ACTIVITIES_URL'),
};

const twitter = (async () => {
  const api = new TwitterOpenApi();
  const data = await fs.readFile('cookie.json', 'utf-8');
  const parsed = JSON.parse(data);
  const cookies = parsed as Cookie[];
  const json = Object.fromEntries(cookies.filter((e) => e.domain === '.x.com').map((e) => [e.name, e.value]));
  const client = await api.getClientFromCookies(json);

  // const client = new TwitterOpenApi().getGuestClient()
  return client;
})();

export const hook: HookFn = (event) => {
  const defaultHook: HookType = {
    lineReadyModule: [lineReady],
    lineTextMessageEventModule: [twitterViewer(twitter), webArchive(archivebox), dumpEvent],
    lineImageMessageEventModule: [],
    lineVideoMessageEventModule: [],
    lineAudioMessageEventModule: [],
    lineLocationMessageEventModule: [],
    lineFileMessageEventModule: [],
    lineStickerMessageEventModule: [],
    lineUnsendMessageEventModule: [],
    lineFollowMessageEventModule: [],
    lineUnfollowMessageEventModule: [],
    lineJoinMessageEventModule: [],
    lineLeaveMessageEventModule: [],
    lineMemberJoinMessageEventModule: [],
    lineMenberLeaveMessageEventModule: [],
    linePostBackMessageEventModule: [],
    lineVideoEventMessageEventModule: [],
    lineBeaconMessageEventModule: [],
    lineAccountLinkMessageEventModule: [],
    lineThingsMessageEventModule: [],
    discordReadyModule: [discordReady, serPresence(discordPresence)],
    discordMessageCreateModule: [],
    discordVoiceStateUpdate: [],
  };

  if (event == env.getString('LINE_SYNCHRONIZE_CHAT.CHANNEL_ID')) {
    defaultHook.lineTextMessageEventModule.push(lineSynchronizeText(discordPush));
    defaultHook.lineImageMessageEventModule.push(lineSynchronizeFile(discordPush));
    defaultHook.lineVideoMessageEventModule.push(lineSynchronizeFile(discordPush));
    defaultHook.lineAudioMessageEventModule.push(lineSynchronizeFile(discordPush));
    defaultHook.lineFileMessageEventModule.push(lineSynchronizeFile(discordPush));
  }

  if (event == env.getString('SUB_LINE_SYNCHRONIZE_CHAT.CHANNEL_ID')) {
    defaultHook.lineTextMessageEventModule = [allWebArchive(archivebox), twitterSnap(putSnap), dumpEvent];
  }
  if (event == env.getString('DISOCRD_SYNCHRONIZE_CHAT.CHANNNEL_ID')) {
    defaultHook.discordMessageCreateModule = [discordSynchronize(linePush)];
  }
  if (event == env.getString('DISOCRD_SYNCHRONIZE_VOICE.GUILD_ID')) {
    defaultHook.discordVoiceStateUpdate = [discordVoicePush(linePush), discordVoicePush(discordPush)];
  }
  return defaultHook;
};
