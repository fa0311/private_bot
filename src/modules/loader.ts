import { serPresence } from '@/modules/discordSetPresence';
import { lineReady, discordReady } from '@/modules/ready';
import { discordVoicePush } from '@/modules/discordVoicePush';
import { HookType, SubHookType } from '@/types/modules';
import { lineSynchronizeText, lineSynchronizeFile, discordSynchronize } from '@/modules/synchronizeChat';
import { twitterViewer } from '@/modules/twitter';
import { discordMusic, discordMusicList, discordMusicSkip } from '@/modules/discordMusic';
import { webArchive, allWebArchive } from '@/modules/webArchive';
import { dumpEvent } from './dumpEvent';
import { WebhookEvent } from '@line/bot-sdk';

const getSorceId = (event: WebhookEvent): string => {
  switch (event.source.type) {
    case 'user':
      return event.source.userId;
    case 'group':
      return event.source.groupId;
    case 'room':
      return event.source.roomId;
  }
};

export const mainHooks: HookType = {
  lineReadyModule: [lineReady],
  lineTextMessageEventModule: [twitterViewer, lineSynchronizeText, webArchive, dumpEvent],
  lineImageMessageEventModule: [lineSynchronizeFile],
  lineVideoMessageEventModule: [lineSynchronizeFile],
  lineAudioMessageEventModule: [lineSynchronizeFile],
  lineLocationMessageEventModule: [],
  lineFileMessageEventModule: [lineSynchronizeFile],
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
  discordReadyModule: [discordReady, serPresence],
  discordMessageCreateModule: [discordSynchronize, discordMusic, discordMusicList, discordMusicSkip],
  discordVoiceStateUpdate: [discordVoicePush],
};

export const subHookList: SubHookType[] = [
  {
    lineCondition: (event: WebhookEvent) => getSorceId(event) == 'C981ac852b7969f8824460e594606d577',
    lineReadyModule: [lineReady],
    lineTextMessageEventModule: [twitterViewer, allWebArchive, dumpEvent],
    lineImageMessageEventModule: [lineSynchronizeFile],
    lineVideoMessageEventModule: [lineSynchronizeFile],
    lineAudioMessageEventModule: [lineSynchronizeFile],
    lineLocationMessageEventModule: [],
    lineFileMessageEventModule: [lineSynchronizeFile],
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
  },
];
