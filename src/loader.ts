import Archivebox from '@/utils/archivebox';

import DiscordPushClient from '@/client/discordPush';
import * as webdav from 'webdav';

import LinePushClient from '@/client/linePush';
import { serPresence } from '@/modules/discordSetPresence';
import { discordVoicePush } from '@/modules/discordVoicePush';
import { dumpEvent } from '@/modules/dumpEvent';
import { discordReady, lineReady } from '@/modules/ready';
import { discordSynchronize, lineSynchronizeFile, lineSynchronizeText } from '@/modules/synchronizeChat';
import { twitterViewer } from '@/modules/twitter';
import { allWebArchive, webArchive } from '@/modules/webArchive';
import { HookFn, HookType } from '@/types/modules';
import * as env from '@/utils/env';
import { makedirs } from '@/utils/webdav';
import dayjs from 'dayjs';

const archivebox = new Archivebox('https://xn--l8jeu7orz.xn--w8j2f.com/add/');

const nextcloud = webdav.createClient(env.getString('WEBDAV.URL'), {
  username: env.getString('WEBDAV.USERNAME'),
  password: env.getString('WEBDAV.PASSWORD'),
});

const putFile = async (name: string, contents: Uint8Array): Promise<string> => {
  const time = dayjs(new Date()).locale('ja').format('YYYY-MM');
  const path = `LINE/${time}/${name}`;
  await makedirs(nextcloud, `LINE/${time}`);
  await nextcloud.putFileContents(path, contents);
  return `${env.getString('WEBDAV.SHARE_BASE_URL')}${path} `;
};

const discordPush = new DiscordPushClient(env.getString('DISCORD_PUSH.TOKEN'), putFile);
const linePush = new LinePushClient(env.getString('LINE_PUSH.TOKEN'), putFile);

const discordPresence = {
  name: env.getString('DISCORD_SET_PRESENCE.ACTIVITIES_NAME'),
  url: env.getString('DISCORD_SET_PRESENCE.ACTIVITIES_URL'),
};

export const hook: HookFn = (event) => {
  const defaultHook: HookType = {
    lineReadyModule: [lineReady],
    lineTextMessageEventModule: [twitterViewer, webArchive(archivebox), dumpEvent],
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
    defaultHook.lineTextMessageEventModule.push(allWebArchive(archivebox));
  }
  if (event == env.getString('DISOCRD_SYNCHRONIZE_CHAT.CHANNNEL_ID')) {
    defaultHook.discordMessageCreateModule = [discordSynchronize(linePush)];
  }
  if (event == env.getString('DISOCRD_SYNCHRONIZE_VOICE.GUILD_ID')) {
    defaultHook.discordVoiceStateUpdate = [discordVoicePush(linePush), discordVoicePush(discordPush)];
  }
  return defaultHook;
};
